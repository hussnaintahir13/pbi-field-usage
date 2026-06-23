# Changelog

All notable changes to this project will be documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] — Unreleased

### Changed
- Targets Power BI API **5.1.0** (was 5.11.0) so the visual imports on older Power BI Desktop, e.g. **April 2023**. Uses `powerbi-visuals-utils-formattingmodel` 5.0.0 (`Card` formatting cards; `populateFormattingSettingsModel` receives the `DataView[]`).

### Added
- Initial release of TrustScore Data Quality Scorecard.
- 0–100 trust score with semi-circular gauge.
- Status badge (Excellent / Good / Warning / Poor / Critical).
- Breakdown cards for Completeness, Duplicates, Freshness, Outliers, Validation Rules.
- Configurable thresholds and colour palette.
- Compact mode, decimal-place control, custom title.
- Friendly empty state and high-contrast support.
