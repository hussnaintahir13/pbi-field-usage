# Release — plug-and-play

This folder contains the built `.pbiviz` for TrustScore Data Quality Scorecard. Download the file and import it into Power BI Desktop — no Node, no `pbiviz` CLI required.

## How to install in Power BI Desktop

1. Download `trustScoreDataQualityScorecard*.pbiviz` from this folder (use the **Download raw file** button in GitHub).
2. In Power BI Desktop, open the report you want to add the visual to.
3. In the **Visualizations** pane, click the **…** at the bottom of the icon grid → **Import a visual from a file**.
4. Click **OK** to the safety warning, browse to the downloaded `.pbiviz`, and pick it.
5. The TrustScore icon appears at the bottom of the Visualizations pane. Drag it onto the canvas and bind your measures.

## How to install in the Power BI Service

1. Same download.
2. In the Power BI Service, open a report in Edit mode → **Visualizations → … → Import a visual from a file** and pick the `.pbiviz`.

## Tenant policy

If the import fails with a policy error, your tenant blocks uncertified custom visuals. Ask your Power BI admin to add this visual to the **organisation visuals** list (Power BI Admin Portal → Tenant settings → Organisational visuals).
