export interface ChecklistItem {
    id: string;
    question: string;
    category: string;
    required: boolean;
    helpText?: string;
    regulationRef?: string;
}
export interface Checklist {
    id: string;
    aggregateId: string;
    entityType: string;
    vertical: string;
    items: ChecklistItem[];
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    createdAt: Date;
}
export interface ChecklistResponse {
    itemId: string;
    answer: 'SIM' | 'NAO' | 'NA' | 'PARCIAL';
    notes?: string;
    evidenceIds?: string[];
}
export interface ChecklistResult {
    checklistId: string;
    totalItems: number;
    answered: number;
    conformeCount: number;
    naoConformeCount: number;
    parcialCount: number;
    naCount: number;
    score: number;
    completedAt: Date;
}
//# sourceMappingURL=checklists.d.ts.map