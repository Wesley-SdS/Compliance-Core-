"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateRangeSchema = exports.PaginationSchema = exports.ChecklistResponseSchema = exports.DocMetadataSchema = exports.AlertConfigSchema = exports.CreateEventSchema = void 0;
const zod_1 = require("zod");
const verticalEnum = zod_1.z.enum(['estetik', 'obra', 'tributo', 'laudo', 'frota', 'lote']);
const alertChannelEnum = zod_1.z.enum(['push', 'email', 'in_app']);
const checklistAnswerEnum = zod_1.z.enum(['SIM', 'NAO', 'NA', 'PARCIAL']);
exports.CreateEventSchema = zod_1.z.object({
    aggregateId: zod_1.z.string().uuid(),
    aggregateType: zod_1.z.string().min(1).max(100),
    eventType: zod_1.z.string().min(1).max(100),
    eventVersion: zod_1.z.number().int().positive(),
    payload: zod_1.z.record(zod_1.z.unknown()),
    metadata: zod_1.z.object({
        actorId: zod_1.z.string().uuid(),
        actorRole: zod_1.z.string().min(1),
        ip: zod_1.z.string().ip(),
        userAgent: zod_1.z.string().optional(),
        correlationId: zod_1.z.string().uuid(),
    }),
    vertical: verticalEnum,
});
exports.AlertConfigSchema = zod_1.z.object({
    entityId: zod_1.z.string().uuid(),
    entityType: zod_1.z.string().min(1).max(100),
    vertical: zod_1.z.string().min(1),
    alertType: zod_1.z.string().min(1).max(100),
    dueDate: zod_1.z.coerce.date(),
    daysBeforeAlert: zod_1.z.array(zod_1.z.number().int().nonnegative()).min(1),
    channels: zod_1.z.array(alertChannelEnum).min(1),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
exports.DocMetadataSchema = zod_1.z.object({
    aggregateId: zod_1.z.string().uuid(),
    aggregateType: zod_1.z.string().min(1).max(100),
    vertical: zod_1.z.string().min(1),
    category: zod_1.z.string().min(1).max(100),
    expiresAt: zod_1.z.coerce.date().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.ChecklistResponseSchema = zod_1.z.object({
    itemId: zod_1.z.string().uuid(),
    answer: checklistAnswerEnum,
    notes: zod_1.z.string().max(2000).optional(),
    evidenceIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
});
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
});
exports.DateRangeSchema = zod_1.z.object({
    start: zod_1.z.coerce.date(),
    end: zod_1.z.coerce.date(),
}).refine((data) => data.start <= data.end, {
    message: 'Start date must be before or equal to end date',
    path: ['start'],
});
//# sourceMappingURL=index.js.map