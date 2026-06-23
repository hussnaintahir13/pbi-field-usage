# TrustScore — Usage Guide

## 1. Import the visual

1. Open Power BI Desktop.
2. In **Visualizations**, click **…** → **Import a visual from a file**.
3. Select the `.pbiviz` for TrustScore.

## 2. Drop it on the canvas

Drag the TrustScore icon from the Visualizations pane onto a report page.

## 3. Bind measures

In the **Fields** well, attach measures or columns to each role:

| Field well | Drag in… |
| --- | --- |
| Total Rows | A measure returning the row count. |
| Null Count | A measure counting nulls / blanks. |
| Duplicate Count | A measure for duplicate rows. |
| Outlier Count | A measure flagging outliers. |
| Failed Rule Count | A measure counting failed validation rules. |
| Freshness Age | A measure in **hours** since last refresh. |
| Custom Score | Optional — supply your own 0–100 score to bypass calculation. |
| Category | Optional grouping; appears in the title. |

## 4. Customise

Open the **Format** pane:

- **Display** — toggle the gauge, breakdown, warning, footer; switch compact mode; set decimal places, gauge thickness, font size, and title.
- **Thresholds** — adjust the cut-offs for Excellent/Good/Warning/Poor.
- **Colors** — override the palette for each status, background, and text.

## 5. Read the result

- **Score** — weighted aggregate (or your Custom Score if supplied).
- **Status badge** — derived from thresholds.
- **Breakdown cards** — Completeness, Duplicates, Freshness, Outliers, Validation Rules. Hover for a tooltip explaining the maths.
- **Warning panel** — appears if null rate, duplicates, failed rules, or stale freshness exceed sensible defaults.
- **Footer** — last refresh age, formatted in hours or days.

## 6. Empty state

If no fields are bound, the visual shows a friendly hint listing the expected fields.

## 7. Tips

- Supply only Custom Score when you already calculate trust elsewhere — the breakdown collapses to a single card.
- Use the Category grouping to show the visual once per scenario via the small-multiples pane.
- Pair with bookmarks to switch between datasets or time slices.
