"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

class BarStyleCardSettings extends FormattingSettingsCard {
    barColor = new formattingSettings.ColorPicker({
        name: "barColor",
        displayName: "Bar color",
        value: { value: "#118DFF" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text size",
        value: 12
    });

    showValues = new formattingSettings.ToggleSwitch({
        name: "showValues",
        displayName: "Show counts on bars",
        value: true
    });

    name: string = "barStyle";
    displayName: string = "Bar style";
    slices: Array<FormattingSettingsSlice> = [this.barColor, this.fontSize, this.showValues];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    barStyleCard = new BarStyleCardSettings();

    cards = [this.barStyleCard];
}
