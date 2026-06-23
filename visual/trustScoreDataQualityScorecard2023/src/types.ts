export type StatusLevel = "Excellent" | "Good" | "Warning" | "Poor" | "Critical";

export interface QualityMeasures {
    totalRows?: number;
    nullCount?: number;
    duplicateCount?: number;
    outlierCount?: number;
    failedRuleCount?: number;
    freshnessAge?: number;
    customScore?: number;
    category?: string;
}

export interface BreakdownScore {
    key: string;
    label: string;
    score: number;
    detail: string;
    tooltip: string;
}

export interface TrustResult {
    score: number;
    status: StatusLevel;
    breakdown: BreakdownScore[];
    warnings: string[];
    hasData: boolean;
    category?: string;
    freshnessAge?: number;
}

export interface Thresholds {
    excellent: number;
    good: number;
    warning: number;
    poor: number;
}

export interface ColorScheme {
    excellent: string;
    good: string;
    warning: string;
    poor: string;
    critical: string;
    background: string;
    text: string;
}
