# Field Usage for Power BI

## Quick start (non-technical)
New here? Read **[HOW-TO-USE.md](HOW-TO-USE.md)** for a plain-English guide.

Find out which fields are used in a Power BI report or page and how many visuals reference each one. Two pieces:

1. **`parser/pbix_field_usage.py`** — reads a `.pbix` file and emits CSVs of field usage.
2. **`visual/fieldUsageVisual/`** — a Power BI custom visual that renders the result as a sorted bar list.

> Why two parts? Custom visuals run sandboxed inside Power BI and can only see fields bound to their own data roles. They cannot inspect other visuals on the page. The parser does the gathering offline; the visual just renders it.

## What "usage" means here

A field counts once per visual that references it in any role — axis, values, tooltip, legend, **or** visual-level filter. Two visuals using `Sales.Id` produce `Sales.Id: 2`.

## Parser

```powershell
cd parser
python pbix_field_usage.py path\to\report.pbix --out-dir out --print-summary
```

Outputs two CSVs in `--out-dir`:

| File | Columns | Use |
|---|---|---|
| `<name>_field_usage_rows.csv` | Page, VisualId, VisualType, Role, Table, Field, Kind, QualifiedField | One row per binding. Drill into who uses what. |
| `<name>_field_usage_summary.csv` | Field, Kind, VisualCount | One row per field, sorted by count. Feed this into the visual. |

Run tests:

```powershell
cd parser
python -m pytest -v
```

## Custom visual

Pre-built package: `visual/fieldUsageVisual/dist/fieldUsageVisualB300348A30D34EED89F61081A3217C30.1.0.0.0.pbiviz`

> **Which file do I import?** Power BI rejects a visual built for a newer API than your Desktop supports ("isn't a valid custom visual").
> - **Older Power BI Desktop (e.g. April 2023):** use `visual/fieldUsageVisual2023/dist/fieldUsage202376C926ECE9D74B8A85180AFE65D7C414.1.0.0.0.pbiviz` — it's built against **API 5.1.0** and imports on April 2023 and all later versions. It appears as **"Field Usage (PBI 2023)"**.
> - **Recent Power BI Desktop:** either file works; the default one above is built against API 5.11.0.

Install into Power BI Desktop:

1. Open Power BI Desktop.
2. **File → Options → Options and settings → Options → Security → Developer**: check *Allow visuals created using the Power BI SDK*.
3. On the **Visualizations** pane, click the **...** menu → **Import a visual from a file** → pick the `.pbiviz` above.
4. **Get data → Text/CSV** and load the `_field_usage_summary.csv` produced by the parser.
5. Drop the Field Usage visual on the canvas, then bind:
   - **Field** ← `Field` column
   - **Usage Count** ← `VisualCount` (use *Sum* aggregation)
   - **Kind** ← `Kind` (optional)

You will see a horizontal bar list sorted by count, e.g.:

```
Sales.Id        ██████████ 2
Sales.Amount    █████      1
Sales.Name      █████      1
```

### Rebuild the visual

```powershell
cd visual\fieldUsageVisual
npm install   # only first time
pbiviz package
```

The new `.pbiviz` lands in `dist/`. The certificate warning during build (`pwsh not recognized`) is harmless — it only matters for the local dev server (`pbiviz start`), not for packaging.

## End-to-end example

```powershell
# 1. Extract field usage from your report
python parser\pbix_field_usage.py "MyReport.pbix" --out-dir out

# 2. Open Power BI Desktop, import the visual, load out\MyReport_field_usage_summary.csv,
#    bind columns to the visual's data roles.
```

## Limitations

- Reads field bindings statically from `Report/Layout`. Dynamic measures created by a visual at render time are not represented if they do not appear in `prototypeQuery.Select`.
- Page-level and report-level filters are not counted (per the chosen counting rule). The parser code is small — extend `extract_bindings` if you want them.
- One `Sales.Id` referenced via two source aliases that map to two different physical tables would show up as two distinct rows (`SalesA.Id`, `SalesB.Id`). That is correct, not a bug.
