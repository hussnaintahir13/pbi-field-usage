# TrustScore — Data Quality Scorecard

## Quick start (non-technical)
New here? Read **[HOW-TO-USE.md](HOW-TO-USE.md)** for a plain-English guide to importing and using this visual.

A Power BI custom visual that summarises whether the data behind a KPI is trustworthy. It renders a 0–100 trust score, a status badge (Excellent → Critical), a semi-circular gauge, a breakdown across five quality dimensions, and an at-a-glance warning panel.

> **Power BI compatibility:** This build targets **API 5.1.0**, so it imports on **Power BI Desktop April 2023 and every later release**. (Builds targeting newer APIs are rejected by older Desktop versions with *"isn't a valid custom visual"*.)

## Why it matters

A KPI can mislead even when it renders cleanly. Stale refreshes, missing values, undetected duplicates, broken validation rules, and outliers all silently erode trust. TrustScore puts a single, explainable signal in front of report consumers so they know whether to act on the number.

## Installation

Grab the built `.pbiviz` from [`release/`](release/) (use **Download raw file** in GitHub) and import it in Power BI Desktop via **Visualizations → … → Import a visual from a file**. See [`release/README.md`](release/README.md) for tenant-policy notes.

## Development setup

```bash
npm install
npm install -g powerbi-visuals-tools
pbiviz --create-cert            # first time only
pbiviz start                    # dev server with hot reload
pbiviz package                  # produces dist/<visual>.pbiviz
```

Enable developer visuals in Power BI Service: **Settings → Developer → Enable developer visual for testing**.

## Data fields

| Role | Kind | Required | Purpose |
| --- | --- | --- | --- |
| Total Rows | Measure | If using auto score | Denominator for rate calculations |
| Null Count | Measure | Optional | Drives completeness |
| Duplicate Count | Measure | Optional | Drives duplicate score |
| Outlier Count | Measure | Optional | Drives outlier score |
| Failed Rule Count | Measure | Optional | Drives validation score |
| Freshness Age | Measure | Optional | Hours since last refresh |
| Custom Score | Measure | Optional | Overrides auto calculation |
| Category | Grouping | Optional | Appears in title |
| Status Text | Grouping | Optional | Reserved for future use |

## Example DAX measures

```DAX
Total Rows = COUNTROWS('Table')
Null Count = COUNTBLANK('Table'[Column])
Duplicate Count = [Total Rows] - DISTINCTCOUNT('Table'[ID])
Outlier Count = CALCULATE(COUNTROWS('Table'), 'Table'[IsOutlier] = TRUE())
Failed Rule Count = CALCULATE(COUNTROWS('Rules'), 'Rules'[Status] = "Failed")
Freshness Age Hours = DATEDIFF(MAX('Table'[LastUpdated]), NOW(), HOUR)
```

## Scoring logic

If a **Custom Score** is supplied it is used directly (clamped 0–100). Otherwise:

```
completenessScore = 100 - (nullCount / totalRows * 100)
duplicateScore    = 100 - (duplicateCount / totalRows * 100)
outlierScore      = 100 - (outlierCount / totalRows * 100)
ruleScore         = 100 - min(100, failedRuleCount * 10)
freshnessScore    = bucket(ageHours)  // ≤24=100, ≤48=80, ≤72=60, ≤168=40, else 20

trustScore = 0.35·completeness + 0.20·duplicates + 0.20·freshness
           + 0.15·outliers     + 0.10·rules
```

## Status thresholds (defaults)

| Range | Status |
| --- | --- |
| 90–100 | Excellent |
| 75–89 | Good |
| 60–74 | Warning |
| 40–59 | Poor |
| 0–39 | Critical |

Thresholds are configurable in the Format pane.

## Usage

See [docs/USAGE.md](docs/USAGE.md).

## Test plan

- Empty data — should show the friendly empty state.
- Only custom score supplied — gauge + badge only, no warnings.
- Auto score with all fields supplied.
- Missing Total Rows — auto score gracefully treats rates as 0.
- Very high null count — should flag completeness warning.
- Freshness > 7 days — should add a freshness warning.
- Compact mode — gauge & font shrink, layout reflows.
- High contrast mode — borders and text remain visible.
- Resize — narrow & short viewport still readable.
- Small mobile tile — content reflows or hides via compact mode.

## AppSource publishing notes

See [docs/APP_SOURCE_CHECKLIST.md](docs/APP_SOURCE_CHECKLIST.md).

## Roadmap

- Drillthrough into per-rule failures.
- Selection / cross-highlight with categorical role.
- Localisation of labels and statuses.
- Optional sparkline of trust score over time.

## Contributing

1. Fork & branch.
2. `npm install` then `pbiviz start` to develop locally.
3. Submit a PR with a description of the change and a screenshot.

Please be respectful in issues and PRs. By contributing you agree to license your work under the MIT licence.

## Author

Syed Hussnain Tahir Sherazi — Associate Data Engineer, Leicester, UK.
[www.syedhussnain.com](https://www.syedhussnain.com) · [LinkedIn](https://uk.linkedin.com/in/hussnainsherazi) · contact@syedhussnain.co.uk

## License

MIT — see [LICENSE](LICENSE).
