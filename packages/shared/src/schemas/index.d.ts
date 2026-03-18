import { z } from 'zod';
export declare const CreateEventSchema: z.ZodObject<{
    aggregateId: z.ZodString;
    aggregateType: z.ZodString;
    eventType: z.ZodString;
    eventVersion: z.ZodNumber;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    metadata: z.ZodObject<{
        actorId: z.ZodString;
        actorRole: z.ZodString;
        ip: z.ZodString;
        userAgent: z.ZodOptional<z.ZodString>;
        correlationId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        actorId: string;
        actorRole: string;
        ip: string;
        correlationId: string;
        userAgent?: string | undefined;
    }, {
        actorId: string;
        actorRole: string;
        ip: string;
        correlationId: string;
        userAgent?: string | undefined;
    }>;
    vertical: z.ZodEnum<["estetik", "obra", "tributo", "laudo", "frota", "lote"]>;
}, "strip", z.ZodTypeAny, {
    vertical: "estetik" | "obra" | "tributo" | "laudo" | "frota" | "lote";
    aggregateId: string;
    aggregateType: string;
    eventType: string;
    eventVersion: number;
    payload: Record<string, unknown>;
    metadata: {
        actorId: string;
        actorRole: string;
        ip: string;
        correlationId: string;
        userAgent?: string | undefined;
    };
}, {
    vertical: "estetik" | "obra" | "tributo" | "laudo" | "frota" | "lote";
    aggregateId: string;
    aggregateType: string;
    eventType: string;
    eventVersion: number;
    payload: Record<string, unknown>;
    metadata: {
        actorId: string;
        actorRole: string;
        ip: string;
        correlationId: string;
        userAgent?: string | undefined;
    };
}>;
export declare const AlertConfigSchema: z.ZodObject<{
    entityId: z.ZodString;
    entityType: z.ZodString;
    vertical: z.ZodString;
    alertType: z.ZodString;
    dueDate: z.ZodDate;
    daysBeforeAlert: z.ZodArray<z.ZodNumber, "many">;
    channels: z.ZodArray<z.ZodEnum<["push", "email", "in_app"]>, "many">;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    vertical: string;
    entityId: string;
    entityType: string;
    alertType: string;
    dueDate: Date;
    daysBeforeAlert: number[];
    channels: ("push" | "email" | "in_app")[];
    metadata?: Record<string, unknown> | undefined;
}, {
    vertical: string;
    entityId: string;
    entityType: string;
    alertType: string;
    dueDate: Date;
    daysBeforeAlert: number[];
    channels: ("push" | "email" | "in_app")[];
    metadata?: Record<string, unknown> | undefined;
}>;
export declare const DocMetadataSchema: z.ZodObject<{
    aggregateId: z.ZodString;
    aggregateType: z.ZodString;
    vertical: z.ZodString;
    category: z.ZodString;
    expiresAt: z.ZodOptional<z.ZodDate>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    vertical: string;
    category: string;
    aggregateId: string;
    aggregateType: string;
    tags?: string[] | undefined;
    expiresAt?: Date | undefined;
}, {
    vertical: string;
    category: string;
    aggregateId: string;
    aggregateType: string;
    tags?: string[] | undefined;
    expiresAt?: Date | undefined;
}>;
export declare const ChecklistResponseSchema: z.ZodObject<{
    itemId: z.ZodString;
    answer: z.ZodEnum<["SIM", "NAO", "NA", "PARCIAL"]>;
    notes: z.ZodOptional<z.ZodString>;
    evidenceIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    itemId: string;
    answer: "PARCIAL" | "SIM" | "NAO" | "NA";
    notes?: string | undefined;
    evidenceIds?: string[] | undefined;
}, {
    itemId: string;
    answer: "PARCIAL" | "SIM" | "NAO" | "NA";
    notes?: string | undefined;
    evidenceIds?: string[] | undefined;
}>;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export declare const DateRangeSchema: z.ZodEffects<z.ZodObject<{
    start: z.ZodDate;
    end: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    start: Date;
    end: Date;
}, {
    start: Date;
    end: Date;
}>, {
    start: Date;
    end: Date;
}, {
    start: Date;
    end: Date;
}>;
export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type AlertConfigInput = z.infer<typeof AlertConfigSchema>;
export type DocMetadataInput = z.infer<typeof DocMetadataSchema>;
export type ChecklistResponseInput = z.infer<typeof ChecklistResponseSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type DateRangeInput = z.infer<typeof DateRangeSchema>;
//# sourceMappingURL=index.d.ts.map