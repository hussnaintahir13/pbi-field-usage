"""Extract field usage from a Power BI .pbix file.

A .pbix is a ZIP archive. Report/Layout is a UTF-16 LE JSON file describing
every page and visual. Each visualContainer has a `config` string holding the
singleVisual definition: prototypeQuery (Select list with field expressions)
and projections (data-role -> queryRef bindings). This script walks those
structures, extracts field references, and emits both a row-level CSV
(one row per binding) and an aggregated summary CSV (field -> visual count).
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
import zipfile
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path


LAYOUT_PATH = "Report/Layout"


@dataclass(frozen=True)
class FieldRef:
    table: str
    name: str
    kind: str  # "Column" | "Measure" | "HierarchyLevel" | "Other"

    @property
    def qualified(self) -> str:
        return f"{self.table}.{self.name}" if self.table else self.name


@dataclass
class Binding:
    page: str
    visual_id: str
    visual_type: str
    role: str
    field: FieldRef


def _load_layout(pbix_path: Path) -> dict:
    with zipfile.ZipFile(pbix_path) as z:
        with z.open(LAYOUT_PATH) as f:
            raw = f.read()
    # Report/Layout is UTF-16 LE with BOM in most PBIX files.
    for enc in ("utf-16", "utf-16-le", "utf-8-sig", "utf-8"):
        try:
            return json.loads(raw.decode(enc))
        except (UnicodeDecodeError, json.JSONDecodeError):
            continue
    raise RuntimeError(f"Could not decode {LAYOUT_PATH} from {pbix_path}")


def _maybe_json(value):
    if isinstance(value, str):
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return value
    return value


def _resolve_source(expr, from_aliases: dict[str, str]) -> str:
    """Walk an Expression tree until we find a SourceRef and resolve it to a table name."""
    if not isinstance(expr, dict):
        return ""
    if "SourceRef" in expr:
        src = expr["SourceRef"]
        if "Entity" in src:
            return src["Entity"]
        if "Source" in src:
            return from_aliases.get(src["Source"], src["Source"])
    for v in expr.values():
        if isinstance(v, dict):
            resolved = _resolve_source(v, from_aliases)
            if resolved:
                return resolved
    return ""


def _extract_fields_from_expression(node, from_aliases: dict[str, str]) -> list[FieldRef]:
    """Recursively walk a Select / expression node and collect every leaf field reference."""
    fields: list[FieldRef] = []
    if not isinstance(node, dict):
        return fields

    # Direct field references.
    if "Column" in node and isinstance(node["Column"], dict):
        col = node["Column"]
        table = _resolve_source(col.get("Expression", {}), from_aliases)
        prop = col.get("Property", "")
        if prop:
            fields.append(FieldRef(table=table, name=prop, kind="Column"))
        return fields

    if "Measure" in node and isinstance(node["Measure"], dict):
        m = node["Measure"]
        table = _resolve_source(m.get("Expression", {}), from_aliases)
        prop = m.get("Property", "")
        if prop:
            fields.append(FieldRef(table=table, name=prop, kind="Measure"))
        return fields

    if "HierarchyLevel" in node and isinstance(node["HierarchyLevel"], dict):
        hl = node["HierarchyLevel"]
        level = hl.get("Level", "")
        hier = hl.get("Expression", {}).get("Hierarchy", {})
        hier_name = hier.get("Hierarchy", "")
        table = _resolve_source(hier.get("Expression", {}), from_aliases)
        name = f"{hier_name}.{level}" if hier_name else level
        if name:
            fields.append(FieldRef(table=table, name=name, kind="HierarchyLevel"))
        return fields

    # Wrappers: Aggregation, Arithmetic, etc. Recurse into all child dicts/lists.
    for v in node.values():
        if isinstance(v, dict):
            fields.extend(_extract_fields_from_expression(v, from_aliases))
        elif isinstance(v, list):
            for item in v:
                if isinstance(item, dict):
                    fields.extend(_extract_fields_from_expression(item, from_aliases))
    return fields


def _build_from_aliases(prototype_query: dict) -> dict[str, str]:
    aliases: dict[str, str] = {}
    for entry in prototype_query.get("From", []) or []:
        if isinstance(entry, dict) and "Name" in entry and "Entity" in entry:
            aliases[entry["Name"]] = entry["Entity"]
    return aliases


def _bindings_for_visual(page: str, visual_container: dict) -> list[Binding]:
    config = _maybe_json(visual_container.get("config", "{}")) or {}
    single = config.get("singleVisual") or {}
    visual_id = config.get("name", "") or visual_container.get("id", "")
    visual_type = single.get("visualType", "") or "unknown"

    prototype = single.get("prototypeQuery") or {}
    from_aliases = _build_from_aliases(prototype)

    # Map queryRef (Select item Name) -> list of FieldRefs found in that Select.
    select_to_fields: dict[str, list[FieldRef]] = {}
    for select in prototype.get("Select", []) or []:
        if not isinstance(select, dict):
            continue
        key = select.get("Name", "")
        select_to_fields[key] = _extract_fields_from_expression(select, from_aliases)

    bindings: list[Binding] = []
    seen: set[tuple[str, str, str]] = set()  # (role, table, name) dedupe per visual

    projections = single.get("projections") or {}
    for role, items in projections.items():
        if not isinstance(items, list):
            continue
        for item in items:
            if not isinstance(item, dict):
                continue
            query_ref = item.get("queryRef", "")
            for fr in select_to_fields.get(query_ref, []):
                key = (role, fr.table, fr.name)
                if key in seen:
                    continue
                seen.add(key)
                bindings.append(Binding(page, visual_id, visual_type, role, fr))

    # Visual-level filters (any binding -> we want them counted).
    filters_raw = _maybe_json(visual_container.get("filters", "[]")) or []
    if isinstance(filters_raw, list):
        for flt in filters_raw:
            if not isinstance(flt, dict):
                continue
            expr = flt.get("expression") or flt
            for fr in _extract_fields_from_expression(expr, from_aliases):
                key = ("Filter", fr.table, fr.name)
                if key in seen:
                    continue
                seen.add(key)
                bindings.append(Binding(page, visual_id, visual_type, "Filter", fr))

    return bindings


def extract_bindings(pbix_path: Path) -> list[Binding]:
    layout = _load_layout(pbix_path)
    all_bindings: list[Binding] = []
    for section in layout.get("sections", []) or []:
        page = section.get("displayName") or section.get("name") or "Unnamed"
        for vc in section.get("visualContainers", []) or []:
            all_bindings.extend(_bindings_for_visual(page, vc))
    return all_bindings


def write_rows_csv(bindings: list[Binding], out: Path) -> None:
    with out.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["Page", "VisualId", "VisualType", "Role", "Table", "Field", "Kind", "QualifiedField"])
        for b in bindings:
            w.writerow([
                b.page, b.visual_id, b.visual_type, b.role,
                b.field.table, b.field.name, b.field.kind, b.field.qualified,
            ])


def write_summary_csv(bindings: list[Binding], out: Path) -> None:
    # Count = number of distinct visuals that reference this field, anywhere.
    field_to_visuals: dict[str, set[str]] = defaultdict(set)
    field_kind: dict[str, str] = {}
    for b in bindings:
        key = b.field.qualified
        field_to_visuals[key].add(f"{b.page}::{b.visual_id}")
        field_kind.setdefault(key, b.field.kind)

    rows = sorted(
        ((k, len(v)) for k, v in field_to_visuals.items()),
        key=lambda r: (-r[1], r[0]),
    )
    with out.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["Field", "Kind", "VisualCount"])
        for name, count in rows:
            w.writerow([name, field_kind.get(name, ""), count])


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Extract field usage from a .pbix file.")
    p.add_argument("pbix", type=Path, help="Path to the .pbix file")
    p.add_argument("--out-dir", type=Path, default=Path("."), help="Output directory")
    p.add_argument("--prefix", default=None, help="Filename prefix (defaults to pbix stem)")
    p.add_argument("--print-summary", action="store_true", help="Print summary to stdout")
    args = p.parse_args(argv)

    if not args.pbix.exists():
        print(f"error: {args.pbix} not found", file=sys.stderr)
        return 2

    args.out_dir.mkdir(parents=True, exist_ok=True)
    prefix = args.prefix or args.pbix.stem

    bindings = extract_bindings(args.pbix)
    rows_path = args.out_dir / f"{prefix}_field_usage_rows.csv"
    summary_path = args.out_dir / f"{prefix}_field_usage_summary.csv"
    write_rows_csv(bindings, rows_path)
    write_summary_csv(bindings, summary_path)

    print(f"wrote {rows_path} ({len(bindings)} bindings)")
    print(f"wrote {summary_path}")

    if args.print_summary:
        field_to_visuals: dict[str, set[str]] = defaultdict(set)
        for b in bindings:
            field_to_visuals[b.field.qualified].add(f"{b.page}::{b.visual_id}")
        for name, vs in sorted(field_to_visuals.items(), key=lambda kv: (-len(kv[1]), kv[0])):
            print(f"  {name}: {len(vs)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
