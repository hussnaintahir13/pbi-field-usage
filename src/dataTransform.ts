import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;
import DataViewValueColumn = powerbi.DataViewValueColumn;
import { BreakdownScore, QualityMeasures, StatusLevel, Thresholds, TrustResult } from "./types";

const clamp = (n: number, min = 0, max = 100): number => Math.max(min, Math.min(max, n));

const safeNumber = (v: powerbi.PrimitiveValue | undefined | null): number | undefined => {
    if (v === undefined || v === null) return undefined;
    const n = Number(v);
    return isFinite(n) ? n : undefined;
};

/** Extract measure values from a categorical DataView. */
export function extractMeasures(dataView: DataView | undefined): QualityMeasures {
    const measures: QualityMeasures = {};
    if (!dataView || !dataView.categorical) return measures;

    const cat = dataView.categorical;
    const values = cat.values;
    if (values) {
        for (const v of values as DataViewValueColumn[]) {
            const roles = v.source.roles || {};
            const value = v.values && v.values.length > 0 ? v.values[0] : undefined;
            const num = safeNumber(value);
            if (roles.totalRows) measures.totalRows = num;
            if (roles.nullCount) measures.nullCount = num;
            if (roles.duplicateCount) measures.duplicateCount = num;
            if (roles.outlierCount) measures.outlierCount = num;
            if (roles.failedRuleCount) measures.failedRuleCount = num;
            if (roles.freshnessAge) measures.freshnessAge = num;
            if (roles.customScore) measures.customScore = num;
        }
    }

    if (cat.categories && cat.categories.length > 0) {
        const firstCat = cat.categories[0];
        const roles = firstCat.source.roles || {};
        const firstVal = firstCat.values && firstCat.values.length > 0 ? firstCat.values[0] : undefined;
        if (roles.category && firstVal != null) measures.category = String(firstVal);
    }

    return measures;
}

export function freshnessScoreFromAge(ageHours: number): number {
    if (!isFinite(ageHours) || ageHours < 0) return 100;
    if (ageHours <= 24) return 100;
    if (ageHours <= 48) return 80;
    if (ageHours <= 72) return 60;
    if (ageHours <= 168) return 40;
    return 20;
}

export function statusForScore(score: number, t: Thresholds): StatusLevel {
    if (score >= t.excellent) return "Excellent";
    if (score >= t.good) return "Good";
    if (score >= t.warning) return "Warning";
    if (score >= t.poor) return "Poor";
    return "Critical";
}

export function calculateTrustResult(m: QualityMeasures, t: Thresholds): TrustResult {
    const breakdown: BreakdownScore[] = [];
    const warnings: string[] = [];

    const hasAny =
        m.customScore !== undefined ||
        m.totalRows !== undefined ||
        m.nullCount !== undefined ||
        m.duplicateCount !== undefined ||
        m.outlierCount !== undefined ||
        m.failedRuleCount !== undefined ||
        m.freshnessAge !== undefined;

    if (!hasAny) {
        return {
            score: 0,
            status: "Critical",
            breakdown: [],
            warnings: [],
            hasData: false,
            category: m.category
        };
    }

    if (m.customScore !== undefined) {
        const score = clamp(m.customScore);
        return {
            score,
            status: statusForScore(score, t),
            breakdown: [{
                key: "customScore",
                label: "Custom Score",
                score,
                detail: `${score.toFixed(1)} (supplied)`,
                tooltip: "Custom score supplied via measure."
            }],
            warnings: score < t.warning ? [`Quality score is ${score.toFixed(1)} — below the Warning threshold of ${t.warning}.`] : [],
            hasData: true,
            category: m.category,
            freshnessAge: m.freshnessAge
        };
    }

    const total = m.totalRows ?? 0;
    const nullRate = total > 0 && m.nullCount !== undefined ? (m.nullCount / total) * 100 : 0;
    const dupRate = total > 0 && m.duplicateCount !== undefined ? (m.duplicateCount / total) * 100 : 0;
    const outlierRate = total > 0 && m.outlierCount !== undefined ? (m.outlierCount / total) * 100 : 0;
    const failedPenalty = m.failedRuleCount !== undefined ? Math.min(100, m.failedRuleCount * 10) : 0;

    const completenessScore = clamp(100 - nullRate);
    const duplicateScore = clamp(100 - dupRate);
    const outlierScore = clamp(100 - outlierRate);
    const ruleScore = clamp(100 - failedPenalty);
    const freshnessScore = m.freshnessAge !== undefined ? freshnessScoreFromAge(m.freshnessAge) : 100;

    breakdown.push(
        { key: "completeness", label: "Completeness", score: completenessScore,
          detail: `${completenessScore.toFixed(1)}% complete`,
          tooltip: `100 - (nullCount / totalRows × 100). Null rate: ${nullRate.toFixed(2)}%` },
        { key: "duplicates", label: "Duplicates", score: duplicateScore,
          detail: `${dupRate.toFixed(1)}% duplicates`,
          tooltip: `100 - (duplicateCount / totalRows × 100). Duplicate rate: ${dupRate.toFixed(2)}%` },
        { key: "freshness", label: "Freshness", score: freshnessScore,
          detail: m.freshnessAge !== undefined ? `${m.freshnessAge.toFixed(1)} hours old` : "n/a",
          tooltip: "Bucketed by age: ≤24h=100, ≤48h=80, ≤72h=60, ≤168h=40, else 20." },
        { key: "outliers", label: "Outliers", score: outlierScore,
          detail: `${outlierRate.toFixed(1)}% outliers`,
          tooltip: `100 - (outlierCount / totalRows × 100). Outlier rate: ${outlierRate.toFixed(2)}%` },
        { key: "rules", label: "Validation Rules", score: ruleScore,
          detail: `${m.failedRuleCount ?? 0} failed`,
          tooltip: `100 - min(100, failedRuleCount × 10). Failed: ${m.failedRuleCount ?? 0}` }
    );

    const score = clamp(
        completenessScore * 0.35 +
        duplicateScore * 0.20 +
        freshnessScore * 0.20 +
        outlierScore * 0.15 +
        ruleScore * 0.10
    );

    if (nullRate >= 5) warnings.push(`${nullRate.toFixed(1)}% missing values detected.`);
    if (m.failedRuleCount && m.failedRuleCount > 0) warnings.push(`${m.failedRuleCount} validation rule(s) failed.`);
    if (m.freshnessAge !== undefined && m.freshnessAge > 168) warnings.push(`Data is over 7 days old (${m.freshnessAge.toFixed(0)}h).`);
    if (dupRate >= 5) warnings.push(`${dupRate.toFixed(1)}% duplicate rows detected.`);

    return {
        score,
        status: statusForScore(score, t),
        breakdown,
        warnings,
        hasData: true,
        category: m.category,
        freshnessAge: m.freshnessAge
    };
}
