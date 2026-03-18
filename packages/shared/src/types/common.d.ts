export type Vertical = 'estetik' | 'obra' | 'tributo' | 'laudo' | 'frota' | 'lote';
export declare const VERTICALS: Record<Vertical, {
    name: string;
    description: string;
}>;
export interface PaginationParams {
    page: number;
    limit: number;
}
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export interface TimelineEvent {
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: Date;
    actor: string;
    metadata?: Record<string, unknown>;
}
export interface TimelineData {
    events: TimelineEvent[];
    entityId: string;
    period: {
        start: Date;
        end: Date;
    };
}
//# sourceMappingURL=common.d.ts.map