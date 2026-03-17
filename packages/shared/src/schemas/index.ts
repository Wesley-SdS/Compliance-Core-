import { z } from 'zod';

const verticalEnum = z.enum(['estetik', 'obra', 'tributo', 'laudo', 'frota', 'lote']);

const alertChannelEnum = z.enum(['push', 'email', 'in_app']);

const checklistAnswerEnum = z.enum(['SIM', 'NAO', 'NA', 'PARCIAL']);

export const CreateEventSchema = z.object({
  aggregateId: z.string().uuid(),
  aggregateType: z.string().min(1).max(100),
  eventType: z.string().min(1).max(100),
  eventVersion: z.number().int().positive(),
  payload: z.record(z.unknown()),
  metadata: z.object({
    actorId: z.string().uuid(),
    actorRole: z.string().min(1),
    ip: z.string().ip(),
    userAgent: z.string().optional(),
    correlationId: z.string().uuid(),
  }),
  vertical: verticalEnum,
});

export const AlertConfigSchema = z.object({
  entityId: z.string().uuid(),
  entityType: z.string().min(1).max(100),
  vertical: z.string().min(1),
  alertType: z.string().min(1).max(100),
  dueDate: z.coerce.date(),
  daysBeforeAlert: z.array(z.number().int().nonnegative()).min(1),
  channels: z.array(alertChannelEnum).min(1),
  metadata: z.record(z.unknown()).optional(),
});

export const DocMetadataSchema = z.object({
  aggregateId: z.string().uuid(),
  aggregateType: z.string().min(1).max(100),
  vertical: z.string().min(1),
  category: z.string().min(1).max(100),
  expiresAt: z.coerce.date().optional(),
  tags: z.array(z.string()).optional(),
});

export const ChecklistResponseSchema = z.object({
  itemId: z.string().uuid(),
  answer: checklistAnswerEnum,
  notes: z.string().max(2000).optional(),
  evidenceIds: z.array(z.string().uuid()).optional(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const DateRangeSchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
}).refine((data) => data.start <= data.end, {
  message: 'Start date must be before or equal to end date',
  path: ['start'],
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type AlertConfigInput = z.infer<typeof AlertConfigSchema>;
export type DocMetadataInput = z.infer<typeof DocMetadataSchema>;
export type ChecklistResponseInput = z.infer<typeof ChecklistResponseSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type DateRangeInput = z.infer<typeof DateRangeSchema>;
