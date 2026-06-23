"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import DataView = powerbi.DataView;
import DataViewCategorical = powerbi.DataViewCategorical;

import { VisualFormattingSettingsModel } from "./settings";

interface Row {
    field: string;
    kind: string;
    count: number;
}

export class Visual implements IVisual {
    private events: IVisualEventService;
    private target: HTMLElement;
    private root: HTMLElement;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;

    constructor(options: VisualConstructorOptions) {
        this.events = options.host.eventService;
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
        this.target.classList.add("fu-root");
        this.root = document.createElement("div");
        this.root.className = "fu-container";
        this.target.appendChild(this.root);
    }

    public update(options: VisualUpdateOptions) {
        this.events.renderingStarted(options);
        try {
            const dv: DataView | undefined = options.dataViews && options.dataViews[0];
            this.formattingSettings = this.formattingSettingsService
                .populateFormattingSettingsModel(VisualFormattingSettingsModel, options.dataViews || []);

            const rows = this.buildRows(dv);
            this.render(rows);
            this.events.renderingFinished(options);
        } catch (error) {
            console.error("fieldUsageVisual update error", error);
            this.events.renderingFailed(options, String(error));
        }
    }

    private buildRows(dv?: DataView): Row[] {
        const cat = dv?.categorical as DataViewCategorical | undefined;
        if (!cat || !cat.categories || cat.categories.length === 0) return [];

        const fieldCat = cat.categories.find(c => c.source.roles && c.source.roles["field"])
            || cat.categories[0];
        const kindCat = cat.categories.find(c => c.source.roles && c.source.roles["kind"]);
        const countVals = cat.values && cat.values.length > 0
            ? cat.values.find(v => v.source.roles && v.source.roles["count"]) || cat.values[0]
            : undefined;

        const fields = fieldCat.values as powerbi.PrimitiveValue[];
        const kinds = kindCat ? (kindCat.values as powerbi.PrimitiveValue[]) : undefined;
        const counts = countVals ? (countVals.values as powerbi.PrimitiveValue[]) : undefined;

        const rows: Row[] = [];
        for (let i = 0; i < fields.length; i++) {
            const f = fields[i];
            if (f === null || f === undefined) continue;
            const kind = kinds ? String(kinds[i] ?? "") : "";
            const raw = counts ? counts[i] : 1;
            const count = typeof raw === "number" ? raw : Number(raw ?? 0);
            rows.push({ field: String(f), kind, count });
        }
        rows.sort((a, b) => b.count - a.count || a.field.localeCompare(b.field));
        return rows;
    }

    private render(rows: Row[]) {
        const root = this.root;
        while (root.firstChild) root.removeChild(root.firstChild);

        const settings = this.formattingSettings.barStyleCard;
        const barColor = settings.barColor.value?.value || "#118DFF";
        const fontSize = settings.fontSize.value || 12;
        const showValues = settings.showValues.value;

        root.style.fontSize = `${fontSize}px`;

        if (rows.length === 0) {
            const empty = document.createElement("div");
            empty.className = "fu-empty";
            empty.textContent = "Drop a Field and a Usage Count to see field usage.";
            root.appendChild(empty);
            return;
        }

        const max = rows.reduce((m, r) => Math.max(m, r.count), 0) || 1;
        const table = document.createElement("div");
        table.className = "fu-table";

        for (const r of rows) {
            const row = document.createElement("div");
            row.className = "fu-row";
            row.title = `${r.field}${r.kind ? " (" + r.kind + ")" : ""}: ${r.count}`;

            const label = document.createElement("div");
            label.className = "fu-label";
            label.textContent = r.field;

            const barWrap = document.createElement("div");
            barWrap.className = "fu-bar-wrap";

            const bar = document.createElement("div");
            bar.className = "fu-bar";
            bar.style.width = `${(r.count / max) * 100}%`;
            bar.style.background = barColor;

            if (showValues) {
                const val = document.createElement("span");
                val.className = "fu-val";
                val.textContent = String(r.count);
                bar.appendChild(val);
            }

            barWrap.appendChild(bar);
            row.appendChild(label);
            row.appendChild(barWrap);
            table.appendChild(row);
        }

        root.appendChild(table);
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}
