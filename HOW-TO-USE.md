# Field Usage — Simple Guide

## What this does

This tool tells you which fields your Power BI report actually uses. It looks at every visual (chart, table, card) and counts how many of them use each field. Then it shows you the result as a simple bar list. The fields used the most sit at the top, so you can spot what matters and what no one uses.

## Step 1 — Make the summary file (Python parser)

The first part is a small program that reads your report file and writes a spreadsheet (a CSV file).

1. You need **Python** installed on your computer. If you do not have it, ask your IT team or get it from [python.org](https://www.python.org/).
2. Find your report file. It is the `.pbix` file that Power BI Desktop saves.
3. Open a terminal (PowerShell) in the project folder and run this command. Replace `MyReport.pbix` with the path to your own report:

   ```powershell
   python parser\pbix_field_usage.py "MyReport.pbix" --out-dir out
   ```

4. This makes two CSV files inside a folder called `out`. The one you want is the **summary** file. Its name ends with `_field_usage_summary.csv` (for example, `out\MyReport_field_usage_summary.csv`).

The summary file has three columns: **Field**, **Kind**, and **VisualCount**.

Want to see what the output looks like before you run it? Open the example file at `sample\sample_field_usage_summary.csv`. It shows the same three columns filled in with sample data.

## Step 2 — Load the CSV into Power BI

Now bring that summary file into Power BI Desktop.

1. Open Power BI Desktop.
2. On the **Home** ribbon, click **Get Data**.
3. Choose **Text/CSV**.
4. Find and pick your `_field_usage_summary.csv` file, then click **Load**.

Your three columns (Field, Kind, VisualCount) are now ready to use.

## Step 3 — Add the visual to your report

1. In the **Visualizations** pane, click the **•••** (more options) button.
2. Choose **Import a visual from a file**.
3. If a warning about custom visuals appears, click **Import**.
4. Pick the file **visual\fieldUsageVisual\dist\fieldUsageVisualB300348A30D34EED89F61081A3217C30.1.0.0.0.pbiviz** and open it.
5. Click the new icon in the Visualizations pane to add the visual to the page.
6. Drag the CSV columns into the wells:
   - Put the **Field** column into the **Field** well.
   - Put the **VisualCount** column into the **Usage Count** well. Then click the small arrow next to it and set it to **Sum**.
   - (Optional) Put the **Kind** column into the **Kind** well.

You should now see a bar list, sorted with the most-used fields on top.

## Buttons & options you can change

Click the **Format** (paint roller) icon to change how the visual looks. Under **Bar style** you can change:

- **Bar color** — pick the color of the bars.
- **Text size** — make the labels bigger or smaller.
- **Show counts on bars** — turn the number on each bar on or off.

## If it looks empty or wrong

- Make sure the **Usage Count** well is set to **Sum**. If it shows "Count" instead, the numbers will be wrong.
- Check that you loaded the **summary** file (the one ending in `_field_usage_summary.csv`), not the rows file.
- Make sure the **Field** column is in the **Field** well and **VisualCount** is in the **Usage Count** well.
- If the visual is missing from the pane, go back to Step 3 and import the `.pbiviz` file again.
