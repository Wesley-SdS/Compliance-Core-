export type ComplianceLevel = 'CRITICO' | 'ATENCAO' | 'BOM' | 'EXCELENTE';
export type CriterionStatus = 'CONFORME' | 'NAO_CONFORME' | 'PARCIAL' | 'NAO_APLICAVEL';
export type ScoreTrend = 'MELHORANDO' | 'ESTAVEL' | 'PIORANDO';
export interface ComplianceCriterion {
    id: string;
    name: string;
    weight: number;
    category: string;
    evaluate: (entity: any) => CriterionResult;
}
export interface CriterionResult {
    criterionId: string;
    status: CriterionStatus;
    score: number;
    details: string;
    evidence?: string[];
}
export interface ComplianceScore {
    id: string;
    aggregateId: string;
    overall: number;
    level: ComplianceLevel;
    breakdown: CriterionResult[];
    trend: ScoreTrend;
    calculatedAt: Date;
}
export interface ScoreHistory {
    scores: ComplianceScore[];
    trend: ScoreTrend;
    average: number;
    min: number;
    max: number;
}
export interface DateRange {
    start: Date;
    end: Date;
}
//# sourceMappingURL=score.d.ts.map