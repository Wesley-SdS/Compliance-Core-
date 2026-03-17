import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { VektusWebhookGuard, DatabaseService, EventStoreService } from '@compliancecore/sdk';
import { ulid } from 'ulid';

interface VektusWebhookPayload {
  event: string;
  fileId: string;
  status: 'completed' | 'failed';
  chunksCount?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
  ) {}

  @Post('vektus')
  @HttpCode(HttpStatus.OK)
  @UseGuards(VektusWebhookGuard)
  @ApiOperation({ summary: 'Webhook callback from Vektus' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  @ApiResponse({ status: 401, description: 'Invalid webhook signature' })
  async handleVektusWebhook(@Body() payload: VektusWebhookPayload) {
    this.logger.log(`Vektus webhook received: ${payload.event} for file ${payload.fileId}`);

    switch (payload.event) {
      case 'file.processed':
        await this.handleFileProcessed(payload);
        break;
      case 'file.failed':
        await this.handleFileFailed(payload);
        break;
      default:
        this.logger.warn(`Unknown Vektus webhook event: ${payload.event}`);
    }

    return { received: true };
  }

  private async handleFileProcessed(payload: VektusWebhookPayload): Promise<void> {
    // Update document status with Vektus file ID
    await this.db.query(
      `UPDATE documents SET data = jsonb_set(
        data::jsonb,
        '{vektusFileId}',
        $1::jsonb
      )::text
      WHERE data::jsonb->>'fileKey' LIKE $2`,
      [JSON.stringify(payload.fileId), `%${payload.fileId}%`],
    );

    // Find the aggregate for event tracking
    const doc = await this.db.queryOne<{ aggregate_id: string; data: any }>(
      `SELECT aggregate_id, data FROM documents
       WHERE data::jsonb->>'vektusFileId' = $1
       LIMIT 1`,
      [payload.fileId],
    );

    if (doc) {
      await this.eventStore.append(
        doc.aggregate_id,
        'Clinica',
        'DOCUMENT_OCR_COMPLETED',
        {
          fileId: payload.fileId,
          chunksCount: payload.chunksCount,
          fileName: doc.data?.fileName,
        },
        {
          actorId: 'vektus-webhook',
          actorRole: 'system',
          ip: '0.0.0.0',
          correlationId: ulid(),
        },
      );
    }

    this.logger.log(`File processed: ${payload.fileId} (${payload.chunksCount} chunks)`);
  }

  private async handleFileFailed(payload: VektusWebhookPayload): Promise<void> {
    this.logger.error(`Vektus file processing failed: ${payload.fileId} - ${payload.error}`);

    const doc = await this.db.queryOne<{ aggregate_id: string }>(
      `SELECT aggregate_id FROM documents
       WHERE data::jsonb->>'vektusFileId' = $1
       LIMIT 1`,
      [payload.fileId],
    );

    if (doc) {
      await this.eventStore.append(
        doc.aggregate_id,
        'Clinica',
        'DOCUMENT_OCR_FAILED',
        {
          fileId: payload.fileId,
          error: payload.error,
        },
        {
          actorId: 'vektus-webhook',
          actorRole: 'system',
          ip: '0.0.0.0',
          correlationId: ulid(),
        },
      );
    }
  }
}
