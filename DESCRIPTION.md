# TrustScore Data Quality Scorecard

**Author:** [Syed Hussnain Tahir Sherazi](https://www.syedhussnain.com)
**License:** MIT
**Category:** KPI / data quality / governance

## Short description (≤100 chars, for AppSource listing)
A 0–100 data-quality scorecard with gauge, status badge, and a breakdown across five quality dimensions.

## Long description
TrustScore is a Power BI custom visual that summarises whether the data behind a KPI is trustworthy. It takes simple measures from a data-quality audit table — row counts, nulls, duplicates, outliers, failed validation rules, freshness age — and produces a single 0–100 trust score with a semi-circular gauge, an Excellent / Good / Warning / Poor / Critical status badge, a breakdown of five quality dimensions (Completeness, Duplicates, Freshness, Outliers, Validation Rules), and a warning panel that calls out the riskiest signals. A Custom Score measure can override the auto-calculation when trust is computed elsewhere.

## What it solves
A KPI can render cleanly while the underlying data is silently broken: stale refreshes, missing values, undetected duplicates, outliers, or failing validation rules erode trust in the number. TrustScore puts a single explainable signal on the report so consumers know whether to act.

## Who it's for
- Finance, FP&A, and ops teams that publish dashboards leadership relies on.
- Data engineering teams running a quality framework (Great Expectations, dbt tests, Soda) and exposing results in a Power BI model.
- Governance leads who want a "is this number safe?" tile next to every KPI.

## Key features
- Weighted auto-score (completeness 35% / duplicates 20% / freshness 20% / outliers 15% / rules 10%) — clamped 0–100.
- Custom Score measure path for teams who calculate trust elsewhere.
- Semi-circular gauge, status badge, breakdown cards with per-card tooltips explaining the maths.
- Warning panel that surfaces null-rate, duplicate, failed-rule and stale-freshness flags.
- Configurable thresholds, full colour palette, compact mode, decimal places, font size.
- Accessibility: aria-labels, keyboard focus on breakdown cards, high-contrast support, status conveyed by both text and colour.

## Privacy & security
No network calls. No third-party JS. `privileges` array is empty. The visual is read-only and never writes back to any data source.

## Author
**Syed Hussnain Tahir Sherazi** — Power BI / Microsoft Fabric developer building the TrustScore Data Quality Scorecard and other Power BI custom visuals.

- Website: [www.syedhussnain.com](https://www.syedhussnain.com)
- Email: [contact@syedhussnain.co.uk](mailto:contact@syedhussnain.co.uk)
- LinkedIn: [linkedin.com/in/hussnainsherazi](https://uk.linkedin.com/in/hussnainsherazi)
- GitHub: [github.com/hussnaintahir13](https://github.com/hussnaintahir13)
