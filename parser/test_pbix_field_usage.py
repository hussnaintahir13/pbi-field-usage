"""Tests for pbix_field_usage. Builds synthetic PBIX layouts in memory and
checks the parser produces the expected aggregated counts.
"""

from __future__ import annotations

import io
import json
import zipfile
from collections import Counter
from pathlib import Path

import pbix_field_usage as pf


def _make_pbix(tmp_path: Path, layout: dict) -> Path:
    pbix = tmp_path / "test.pbix"
    raw = json.dumps(layout).encode("utf-16")  # UTF-16 LE with BOM
    with zipfile.ZipFile(pbix, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("Report/Layout", raw)
        # Real PBIX files have more parts; the parser only needs Report/Layout.
        z.writestr("[Content_Types].xml", "<Types/>")
    return pbix


def _col_select(query_name: str, source_alias: str, table: str, column: str) -> dict:
    # Note: _resolve_source uses the From aliases, so source_alias maps to table.
    return {
        "Column": {
            "Expression": {"SourceRef": {"Source": source_alias}},
            "Property": column,
        },
        "Name": query_name,
    }


def _measure_select(query_name: str, source_alias: str, name: str) -> dict:
    return {
        "Measure": {
            "Expression": {"SourceRef": {"Source": source_alias}},
            "Property": name,
        },
        "Name": query_name,
    }


def _visual(visual_id: str, vtype: str, from_, selects, projections, filters=None) -> dict:
    config = {
        "name": visual_id,
        "singleVisual": {
            "visualType": vtype,
            "prototypeQuery": {"Version": 2, "From": from_, "Select": selects},
            "projections": projections,
        },
    }
    vc = {"config": json.dumps(config)}
    if filters is not None:
        vc["filters"] = json.dumps(filters)
    return vc


def test_aggregation_counts_visuals_not_bindings(tmp_path):
    """Field 'Id' used in two visuals (any role) should report VisualCount=2."""
    from_ = [{"Name": "s", "Entity": "Sales", "Type": 0}]
    layout = {
        "sections": [
            {
                "name": "p1",
                "displayName": "Page 1",
                "visualContainers": [
                    _visual(
                        "vA", "table", from_,
                        [_col_select("Sales.Id", "s", "Sales", "Id"),
                         _col_select("Sales.Name", "s", "Sales", "Name")],
                        {"Values": [{"queryRef": "Sales.Id"},
                                    {"queryRef": "Sales.Name"}]},
                    ),
                    _visual(
                        "vB", "barChart", from_,
                        [_col_select("Sales.Id", "s", "Sales", "Id"),
                         _measure_select("Sum(Amount)", "s", "TotalAmount")],
                        {"Category": [{"queryRef": "Sales.Id"}],
                         "Y": [{"queryRef": "Sum(Amount)"}]},
                    ),
                ],
            }
        ]
    }
    pbix = _make_pbix(tmp_path, layout)
    bindings = pf.extract_bindings(pbix)

    field_visuals: dict[str, set[str]] = {}
    for b in bindings:
        field_visuals.setdefault(b.field.qualified, set()).add(b.visual_id)

    assert field_visuals["Sales.Id"] == {"vA", "vB"}, field_visuals
    assert field_visuals["Sales.Name"] == {"vA"}
    assert field_visuals["Sales.TotalAmount"] == {"vB"}


def test_same_field_in_two_roles_counts_once_per_visual(tmp_path):
    """If a visual binds Id to both Category and Tooltip, that visual counts once for Id."""
    from_ = [{"Name": "s", "Entity": "Sales", "Type": 0}]
    layout = {
        "sections": [
            {
                "name": "p1",
                "displayName": "Page 1",
                "visualContainers": [
                    _visual(
                        "vA", "table", from_,
                        [_col_select("Sales.Id", "s", "Sales", "Id")],
                        {"Category": [{"queryRef": "Sales.Id"}],
                         "Tooltips": [{"queryRef": "Sales.Id"}]},
                    ),
                ],
            }
        ]
    }
    pbix = _make_pbix(tmp_path, layout)
    bindings = pf.extract_bindings(pbix)

    # Two bindings (one per role) but one visual.
    visuals_for_id = {b.visual_id for b in bindings if b.field.qualified == "Sales.Id"}
    assert visuals_for_id == {"vA"}
    roles = Counter(b.role for b in bindings if b.field.qualified == "Sales.Id")
    assert roles == Counter({"Category": 1, "Tooltips": 1})


def test_aggregation_wrapper_extracts_inner_column(tmp_path):
    """Sum(Sales.Amount) should resolve to Sales.Amount as a Column reference."""
    from_ = [{"Name": "s", "Entity": "Sales", "Type": 0}]
    agg_select = {
        "Aggregation": {
            "Expression": {
                "Column": {
                    "Expression": {"SourceRef": {"Source": "s"}},
                    "Property": "Amount",
                }
            },
            "Function": 0,
        },
        "Name": "Sum(Sales.Amount)",
    }
    layout = {
        "sections": [
            {
                "name": "p1",
                "displayName": "Page 1",
                "visualContainers": [
                    _visual(
                        "vA", "card", from_, [agg_select],
                        {"Values": [{"queryRef": "Sum(Sales.Amount)"}]},
                    ),
                ],
            }
        ]
    }
    pbix = _make_pbix(tmp_path, layout)
    bindings = pf.extract_bindings(pbix)
    assert any(b.field.qualified == "Sales.Amount" and b.field.kind == "Column"
               for b in bindings), bindings


def test_visual_level_filter_counted(tmp_path):
    """A visual-level filter on Sales.Region should count that visual for Sales.Region."""
    from_ = [{"Name": "s", "Entity": "Sales", "Type": 0}]
    flt = {
        "expression": {
            "Column": {
                "Expression": {"SourceRef": {"Source": "s"}},
                "Property": "Region",
            }
        }
    }
    layout = {
        "sections": [
            {
                "name": "p1",
                "displayName": "Page 1",
                "visualContainers": [
                    _visual(
                        "vA", "table", from_,
                        [_col_select("Sales.Id", "s", "Sales", "Id")],
                        {"Values": [{"queryRef": "Sales.Id"}]},
                        filters=[flt],
                    ),
                ],
            }
        ]
    }
    pbix = _make_pbix(tmp_path, layout)
    bindings = pf.extract_bindings(pbix)
    region = [b for b in bindings if b.field.qualified == "Sales.Region"]
    assert region and region[0].role == "Filter"


def test_summary_csv_sorted_by_count(tmp_path):
    from_ = [{"Name": "s", "Entity": "Sales", "Type": 0}]
    layout = {
        "sections": [
            {
                "name": "p1",
                "displayName": "Page 1",
                "visualContainers": [
                    _visual("vA", "table", from_,
                            [_col_select("Sales.Id", "s", "Sales", "Id")],
                            {"Values": [{"queryRef": "Sales.Id"}]}),
                    _visual("vB", "table", from_,
                            [_col_select("Sales.Id", "s", "Sales", "Id"),
                             _col_select("Sales.Name", "s", "Sales", "Name")],
                            {"Values": [{"queryRef": "Sales.Id"},
                                        {"queryRef": "Sales.Name"}]}),
                ],
            }
        ]
    }
    pbix = _make_pbix(tmp_path, layout)
    bindings = pf.extract_bindings(pbix)
    out = tmp_path / "summary.csv"
    pf.write_summary_csv(bindings, out)
    lines = out.read_text(encoding="utf-8").splitlines()
    assert lines[0] == "Field,Kind,VisualCount"
    # Sales.Id (2) should come before Sales.Name (1)
    assert lines[1].startswith("Sales.Id,")
    assert lines[2].startswith("Sales.Name,")
