# TrustScore Data Quality Scorecard — API 5.1.0 build (Power BI Desktop April 2023+)

This is the [trustscore-data-quality-scorecard](https://github.com/hussnaintahir13/trustscore-data-quality-scorecard)
visual rebuilt against **Power BI API 5.1.0** so it imports on older Power BI Desktop
(e.g. **April 2023**), which rejects the original API 5.11.0 build with
*"isn't a valid custom visual"*.

## Why it lives here

It was intended for a dedicated repo (`pbi-data-quality-scorecard-old`), but the
automation session that produced it could only push to `pbi-field-usage`. It is
parked here so the work isn't lost; move it to its own repo when convenient
(see below).

## What changed vs. the original

| File | Change |
|---|---|
| `pbiviz.json` | `apiVersion` `5.11.0` → `5.1.0` |
| `package.json` | `powerbi-visuals-api` → `5.1.0`; `powerbi-visuals-utils-formattingmodel` → `5.0.0` |
| `src/settings.ts` | `formattingSettings.SimpleCard` → `formattingSettings.Card` (6.x-only class) |
| `src/visual.ts` | `populateFormattingSettingsModel(VisualSettings, dataView)` → passes `options.dataViews \|\| []` (5.x signature takes `DataView[]`) |

GUID and display name are unchanged, so it is a drop-in replacement for the original.

## The importable file

`dist/trustScoreDataQualityScorecard6FA0A1B24F1F49B8B3C5C9C0A7F7E3D2.1.0.0.0.pbiviz`
(verified to declare `apiVersion: 5.1.0`).

## Rebuild

```bash
npm install
npx pbiviz package   # output lands in dist/
```

## Move to its own repo later

```bash
# create an empty repo named pbi-data-quality-scorecard-old on GitHub first, then:
cp -r visual/trustScoreDataQualityScorecard2023 /tmp/dq-old && cd /tmp/dq-old
git init && git add -A && git commit -m "TrustScore scorecard (API 5.1.0, PBI April 2023+)"
git branch -M main
git remote add origin https://github.com/hussnaintahir13/pbi-data-quality-scorecard-old.git
git push -u origin main
```
