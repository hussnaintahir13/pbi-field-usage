import "./../style/visual.less";

import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";

import { VisualSettings } from "./settings";
import { calculateTrustResult, extractMeasures } from "./dataTransform";
import { ColorScheme, StatusLevel, Thresholds, TrustResult } from "./types";

const SVG_NS = "http://www.w3.org/2000/svg";

export class Visual implements IVisual {
    private host: powerbi.extensibility.visual.IVisualHost;
    private root: HTMLElement;
    private settings: VisualSettings = new VisualSettings();
    private formattingSettingsService: FormattingSettingsService;
    private thresholds: Thresholds = { excellent: 90, good: 75, warning: 60, poor: 40 };

    constructor(options?: VisualConstructorOptions) {
        if (!options) {
            throw new Error("TrustScore: VisualConstructorOptions are required.");
        }
        this.host = options.host;
        this.root = options.element;
        this.root.classList.add("trustscore-root");
        this.formattingSettingsService = new FormattingSettingsService();
    }

    public update(options: VisualUpdateOptions): void {
        const dataView = options.dataViews && options.dataViews[0];
        this.settings = this.formattingSettingsService.populateFormattingSettingsModel(VisualSettings, options.dataViews || []);

        const t = this.normalizeThresholds();
        this.thresholds = t;
        const measures = extractMeasures(dataView);
        const result = calculateTrustResult(measures, t);

        this.render(result, options.viewport.width, options.viewport.height);
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.settings);
    }

    /** Clamp thresholds to [0,100] and sort descending so excellent >= good >= warning >= poor. */
    private normalizeThresholds(): Thresholds {
        const clamp = (n: number): number => Math.max(0, Math.min(100, isFinite(n) ? n : 0));
        const t = this.settings.thresholds;
        const [excellent, good, warning, poor] = [
            clamp(t.excellent.value),
            clamp(t.good.value),
            clamp(t.warning.value),
            clamp(t.poor.value)
        ].sort((a, b) => b - a);
        return { excellent, good, warning, poor };
    }

    private getColors(): ColorScheme {
        const c = this.settings.colors;
        return {
            excellent: c.excellentColor.value.value,
            good: c.goodColor.value.value,
            warning: c.warningColor.value.value,
            poor: c.poorColor.value.value,
            critical: c.criticalColor.value.value,
            background: c.backgroundColor.value.value,
            text: c.textColor.value.value
        };
    }

    private statusColor(status: StatusLevel, colors: ColorScheme): string {
        switch (status) {
            case "Excellent": return colors.excellent;
            case "Good": return colors.good;
            case "Warning": return colors.warning;
            case "Poor": return colors.poor;
            case "Critical": return colors.critical;
        }
    }

    private render(result: TrustResult, width: number, height: number): void {
        const colors = this.getColors();
        const d = this.settings.display;
        while (this.root.firstChild) this.root.removeChild(this.root.firstChild);
        this.root.style.background = colors.background;
        this.root.style.color = colors.text;
        this.root.style.fontSize = `${d.fontSize.value}px`;
        this.root.setAttribute("role", "group");
        this.root.setAttribute("aria-label", "TrustScore data quality scorecard");

        if (!result.hasData) {
            this.renderEmptyState();
            return;
        }

        const compact = d.compactMode.value || width < 320 || height < 220;

        const title = document.createElement("div");
        title.className = "ts-title";
        title.textContent = result.category
            ? `${d.titleText.value} — ${result.category}`
            : d.titleText.value;
        this.root.appendChild(title);

        const scoreColor = this.statusColor(result.status, colors);

        const main = document.createElement("div");
        main.className = "ts-main" + (compact ? " compact" : "");
        this.root.appendChild(main);

        if (d.showGauge.value) {
            main.appendChild(this.buildGauge(result.score, scoreColor, compact));
        }

        const scoreBlock = document.createElement("div");
        scoreBlock.className = "ts-score-block";
        const scoreEl = document.createElement("div");
        scoreEl.className = "ts-score";
        scoreEl.style.color = scoreColor;
        scoreEl.textContent = result.score.toFixed(d.decimalPlaces.value);
        scoreEl.setAttribute("aria-label", `Score ${result.score.toFixed(d.decimalPlaces.value)} out of 100`);
        const badge = document.createElement("div");
        badge.className = "ts-badge";
        badge.textContent = result.status;
        badge.style.background = scoreColor;
        badge.setAttribute("role", "status");
        scoreBlock.appendChild(scoreEl);
        scoreBlock.appendChild(badge);
        main.appendChild(scoreBlock);

        if (d.showBreakdown.value && result.breakdown.length > 0) {
            this.root.appendChild(this.buildBreakdown(result, colors));
        }

        if (d.showWarning.value && result.warnings.length > 0) {
            const warn = document.createElement("div");
            warn.className = "ts-warning";
            warn.setAttribute("role", "alert");
            warn.textContent = "Data quality risk detected: " + result.warnings.join(" ");
            this.root.appendChild(warn);
        }

        if (d.showFooter.value) {
            const footer = document.createElement("div");
            footer.className = "ts-footer";
            footer.textContent = result.freshnessAge !== undefined
                ? `Last refresh age: ${this.formatAge(result.freshnessAge)}`
                : "Refresh age not provided.";
            this.root.appendChild(footer);
        }
    }

    private buildGauge(score: number, color: string, compact: boolean): SVGSVGElement {
        const size = compact ? 110 : 160;
        const thickness = this.settings.display.gaugeThickness.value;
        const r = (size - thickness) / 2;
        const cx = size / 2;
        const cy = size / 2 + 10;

        const svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttribute("class", "ts-gauge");
        svg.setAttribute("width", String(size));
        svg.setAttribute("height", String(size * 0.7));
        svg.setAttribute("viewBox", `0 0 ${size} ${size * 0.7}`);
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", `Gauge showing ${score.toFixed(0)} out of 100`);

        // Semi-circle track
        const track = document.createElementNS(SVG_NS, "path");
        track.setAttribute("d", this.arcPath(cx, cy, r, -180, 0));
        track.setAttribute("fill", "none");
        track.setAttribute("stroke", "#E1E1E1");
        track.setAttribute("stroke-width", String(thickness));
        track.setAttribute("stroke-linecap", "round");
        svg.appendChild(track);

        const endAngle = -180 + (180 * Math.max(0, Math.min(100, score)) / 100);
        const value = document.createElementNS(SVG_NS, "path");
        value.setAttribute("d", this.arcPath(cx, cy, r, -180, endAngle));
        value.setAttribute("fill", "none");
        value.setAttribute("stroke", color);
        value.setAttribute("stroke-width", String(thickness));
        value.setAttribute("stroke-linecap", "round");
        svg.appendChild(value);

        return svg;
    }

    private arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
        const s = this.polar(cx, cy, r, startDeg);
        const e = this.polar(cx, cy, r, endDeg);
        const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
        return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
    }

    private polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
        const rad = (deg * Math.PI) / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    }

    private buildBreakdown(result: TrustResult, colors: ColorScheme): HTMLElement {
        const list = document.createElement("div");
        list.className = "ts-breakdown";
        list.setAttribute("role", "list");
        result.breakdown.forEach(b => {
            const card = document.createElement("div");
            card.className = "ts-card";
            card.setAttribute("role", "listitem");
            card.setAttribute("tabindex", "0");
            card.setAttribute("aria-label", `${b.label}: ${b.detail}. Score ${b.score.toFixed(0)} out of 100.`);
            card.title = b.tooltip;
            const label = document.createElement("div");
            label.className = "ts-card-label";
            label.textContent = b.label;
            const score = document.createElement("div");
            score.className = "ts-card-score";
            score.textContent = b.score.toFixed(0);
            score.style.color = this.statusColor(this.scoreToStatus(b.score), colors);
            const detail = document.createElement("div");
            detail.className = "ts-card-detail";
            detail.textContent = b.detail;
            const bar = document.createElement("div");
            bar.className = "ts-card-bar";
            const fill = document.createElement("div");
            fill.className = "ts-card-bar-fill";
            fill.style.width = `${Math.max(0, Math.min(100, b.score))}%`;
            fill.style.background = this.statusColor(this.scoreToStatus(b.score), colors);
            bar.appendChild(fill);
            card.appendChild(label);
            card.appendChild(score);
            card.appendChild(detail);
            card.appendChild(bar);
            list.appendChild(card);
        });
        return list;
    }

    private scoreToStatus(s: number): StatusLevel {
        const t = this.thresholds;
        if (s >= t.excellent) return "Excellent";
        if (s >= t.good) return "Good";
        if (s >= t.warning) return "Warning";
        if (s >= t.poor) return "Poor";
        return "Critical";
    }

    private formatAge(hours: number): string {
        if (hours < 1) return `${(hours * 60).toFixed(0)} minutes`;
        if (hours < 48) return `${hours.toFixed(1)} hours`;
        return `${(hours / 24).toFixed(1)} days`;
    }

    private renderEmptyState(): void {
        const wrap = document.createElement("div");
        wrap.className = "ts-empty";
        wrap.setAttribute("role", "status");
        const h = document.createElement("h3");
        h.textContent = "TrustScore Data Quality Scorecard";
        wrap.appendChild(h);
        const p = document.createElement("p");
        p.textContent = "Add measures (Total Rows, Null Count, Duplicate Count, Outlier Count, Failed Rule Count, Freshness Age) or a Custom Score to begin.";
        wrap.appendChild(p);
        this.root.appendChild(wrap);
    }
}
