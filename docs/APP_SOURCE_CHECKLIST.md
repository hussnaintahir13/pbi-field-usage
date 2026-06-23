# AppSource Submission Checklist

## Packaging

- [ ] `pbiviz package` produces a `.pbiviz` from a clean clone.
- [ ] `pbiviz.json` GUID is unique and stable across releases.
- [ ] Version in `package.json` and `pbiviz.json` matches the release tag.
- [ ] `assets/icon.png` is 300×300, transparent background.

## Sample content

- [ ] Sample `.pbix` file demonstrating the visual with realistic data.
- [ ] Sample CSV / sample model that ships alongside.

## Documentation

- [ ] Privacy policy URL (required by Partner Center).
- [ ] Support URL — issues link or help inbox.
- [ ] Terms of use URL.
- [ ] Public README and CHANGELOG.

## Listing assets

- [ ] At least 3 screenshots (1280×720) with no PII.
- [ ] A short description (≤100 chars) and long description.
- [ ] Promotional video (optional but recommended).
- [ ] Logo (300×300) and small logo (48×48).

## Test cases

- [ ] Empty data state renders.
- [ ] Custom Score path.
- [ ] Auto score path with every measure.
- [ ] Missing Total Rows.
- [ ] Very high null count.
- [ ] Freshness > 7 days.
- [ ] Compact mode.
- [ ] High-contrast mode.
- [ ] Resize from full-page to small tile.

## Accessibility notes

- [ ] All non-decorative elements have `aria-label`s.
- [ ] Status is conveyed by both text and colour.
- [ ] Keyboard focus is visible on breakdown cards.
- [ ] Tested with Windows high-contrast and Power BI's "Show focus" mode.

## Security & privacy

- [ ] No external HTTP/HTTPS calls — verify via the browser's network panel.
- [ ] No third-party JS at runtime.
- [ ] `privileges` array in `capabilities.json` is empty.
- [ ] No telemetry beyond what the host provides.
