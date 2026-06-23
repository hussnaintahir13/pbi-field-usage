import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.Card;
import FormattingSettingsModel = formattingSettings.Model;
import FormattingSettingsSlice = formattingSettings.Slice;

class DisplayCard extends FormattingSettingsCard {
    name = "display";
    displayName = "Display";

    showGauge = new formattingSettings.ToggleSwitch({ name: "showGauge", displayName: "Show gauge", value: true });
    showBreakdown = new formattingSettings.ToggleSwitch({ name: "showBreakdown", displayName: "Show breakdown", value: true });
    showWarning = new formattingSettings.ToggleSwitch({ name: "showWarning", displayName: "Show warning message", value: true });
    showFooter = new formattingSettings.ToggleSwitch({ name: "showFooter", displayName: "Show footer", value: true });
    compactMode = new formattingSettings.ToggleSwitch({ name: "compactMode", displayName: "Compact mode", value: false });
    decimalPlaces = new formattingSettings.NumUpDown({ name: "decimalPlaces", displayName: "Score decimal places", value: 0 });
    gaugeThickness = new formattingSettings.NumUpDown({ name: "gaugeThickness", displayName: "Gauge thickness (px)", value: 14 });
    fontSize = new formattingSettings.NumUpDown({ name: "fontSize", displayName: "Font size", value: 14 });
    titleText = new formattingSettings.TextInput({ name: "titleText", displayName: "Title", value: "TrustScore", placeholder: "TrustScore" });

    slices: FormattingSettingsSlice[] = [
        this.showGauge, this.showBreakdown, this.showWarning, this.showFooter,
        this.compactMode, this.decimalPlaces, this.gaugeThickness, this.fontSize, this.titleText
    ];
}

class ThresholdsCard extends FormattingSettingsCard {
    name = "thresholds";
    displayName = "Thresholds";

    excellent = new formattingSettings.NumUpDown({ name: "excellent", displayName: "Excellent ≥", value: 90 });
    good = new formattingSettings.NumUpDown({ name: "good", displayName: "Good ≥", value: 75 });
    warning = new formattingSettings.NumUpDown({ name: "warning", displayName: "Warning ≥", value: 60 });
    poor = new formattingSettings.NumUpDown({ name: "poor", displayName: "Poor ≥", value: 40 });

    slices: FormattingSettingsSlice[] = [this.excellent, this.good, this.warning, this.poor];
}

class ColorsCard extends FormattingSettingsCard {
    name = "colors";
    displayName = "Colors";

    excellentColor = new formattingSettings.ColorPicker({ name: "excellentColor", displayName: "Excellent", value: { value: "#107C10" } });
    goodColor = new formattingSettings.ColorPicker({ name: "goodColor", displayName: "Good", value: { value: "#4F8A10" } });
    warningColor = new formattingSettings.ColorPicker({ name: "warningColor", displayName: "Warning", value: { value: "#D9822B" } });
    poorColor = new formattingSettings.ColorPicker({ name: "poorColor", displayName: "Poor", value: { value: "#B85C00" } });
    criticalColor = new formattingSettings.ColorPicker({ name: "criticalColor", displayName: "Critical", value: { value: "#A4262C" } });
    backgroundColor = new formattingSettings.ColorPicker({ name: "backgroundColor", displayName: "Background", value: { value: "#FFFFFF" } });
    textColor = new formattingSettings.ColorPicker({ name: "textColor", displayName: "Text", value: { value: "#252423" } });

    slices: FormattingSettingsSlice[] = [
        this.excellentColor, this.goodColor, this.warningColor, this.poorColor,
        this.criticalColor, this.backgroundColor, this.textColor
    ];
}

export class VisualSettings extends FormattingSettingsModel {
    display = new DisplayCard();
    thresholds = new ThresholdsCard();
    colors = new ColorsCard();
    cards = [this.display, this.thresholds, this.colors];
}
