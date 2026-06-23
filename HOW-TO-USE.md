# TrustScore Data Quality Scorecard — Simple Guide

## What this visual does

This visual tells you if you can trust your data. It takes a few numbers about your data — like how many rows it has, how many values are missing, and how old it is — and turns them into one easy score from 0 to 100. It shows that score on a gauge with a colored status badge, so anyone can see at a glance whether the data behind a report is safe to use.

## What data you need

Drop your measures into these field wells. Most are optional, but the more you add, the better the score.

- **Total Rows** — the total number of rows in your data. Add this if you want the visual to work out the score for you. (Recommended)
- **Null Count** — how many values are blank or missing. (Optional)
- **Duplicate Count** — how many rows are repeated. (Optional)
- **Outlier Count** — how many values look unusual or out of range. (Optional)
- **Failed Rule Count** — how many of your data checks did not pass. (Optional)
- **Freshness Age** — how old the data is, in hours since the last refresh. (Optional)
- **Custom Score (optional)** — if you already work out your own trust score somewhere else, put it here. The visual will use this number directly and skip its own math. (Optional)
- **Category (optional)** — a label for the data, such as a table or report name. It shows up in the title. (Optional)

## How to add it to your report (step by step)

1. Open Power BI Desktop and open or create a report.
2. In the **Visualizations** pane, click the **•••** (more options) button.
3. Choose **Import a visual from a file**.
4. If a warning about custom visuals appears, click **Import**.
5. Pick the file **dist\trustScoreDataQualityScorecard6FA0A1B24F1F49B8B3C5C9C0A7F7E3D2.1.0.0.0.pbiviz** and open it.
6. Click the new icon in the Visualizations pane to add the visual to the page.
7. Select the visual, then drag your fields into the wells listed above.

## Buttons & options you can change

Click the visual, then open the **Format** pane (the paint roller icon) to find these settings.

**Display**
- **Show gauge** — turn the round score gauge on or off.
- **Show breakdown** — show or hide the cards that explain each part of the score.
- **Show warning message** — show or hide the panel that points out the biggest risks.
- **Show footer** — show or hide the small text at the bottom.
- **Compact mode** — shrink everything to fit a small tile.
- **Score decimal places** — how many decimal points to show on the score (0 means a whole number).
- **Gauge thickness (px)** — how thick the gauge ring looks.
- **Font size** — make the text bigger or smaller.
- **Title** — type your own title for the visual.

**Thresholds**
- **Excellent ≥** — the score needed to count as Excellent (default 90).
- **Good ≥** — the score needed to count as Good (default 75).
- **Warning ≥** — the score needed to count as Warning (default 60).
- **Poor ≥** — the score needed to count as Poor (default 40). Anything below this is Critical.

**Colors**
- **Excellent**, **Good**, **Warning**, **Poor**, **Critical** — pick the color for each status level.
- **Background** — the color behind the visual.
- **Text** — the color of the words.

## If it looks empty or wrong

- **It looks empty?** Make sure you dragged at least one measure into a field well. Add **Total Rows** so the visual can work out a score.
- **The score seems off?** Check that each measure is in the right well. For example, **Freshness Age** should be in hours, not days.
- **Wrong status color or label?** Open the **Thresholds** card and check the cutoff numbers match what you expect.
- **Still stuck?** Click the visual and confirm your measures return real numbers, not blanks or errors, in your data model.
