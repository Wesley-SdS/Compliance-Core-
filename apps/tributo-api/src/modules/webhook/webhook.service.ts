import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService, ComplianceLogger } from '@compliancecore/sdk';

export interface VektusWebhookPayload {
  event: string;
  fileId: string;
  status?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

@Injectable()
export class WebhookService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('WebhookService');
  }

  async handleVektusEvent(payload: VektusWebhookPayload) {
    const { event, fileId } = payload;

    if (!event || !fileId) {
      throw new BadRequestException('Missing required fields: event, fileId');
    }

    this.logger.log(`Vektus webhook received: ${event}`, { fileId, event });

    switch (event) {
      case 'file.processed':
        await this.handleFileProcessed(fileId);
        break;
      case 'file.failed':
        await this.handleFileFailed(fileId, payload);
        break;
      case 'file.deleted':
        await this.handleFileDeleted(fileId);
        break;
      default:
        this.logger.warn(`Unknown Vektus webhook event: ${event}`, { fileId });
    }

    return { received: true, event, fileId };
  }

  private async handleFileProcessed(fileId: string) {
    await this.db.query(
      `UPDATE sped_files SET status = 'PROCESSADO', updated_at = NOW() WHERE vektus_file_id = $1 AND status != 'VALIDADO'`,
      [fileId],
    );
    this.logger.log(`File processed: ${fileId}`);
  }

  private async handleFileFailed(fileId: string, payload: VektusWebhookPayload) {
    await this.db.query(
      `UPDATE sped_files SET status = 'ERRO', parse_errors = COALESCE(parse_errors, '[]'::jsonb) || $2::jsonb, updated_at = NOW() WHERE vektus_file_id = $1`,
      [fileId, JSON.stringify([payload.error ?? 'Vektus processing failed'])],
    );
    this.logger.warn(`File failed: ${fileId}`, { error: payload.error });
  }

  private async handleFileDeleted(fileId: string) {
    await this.db.query(
      `UPDATE sped_files SET status = 'REMOVIDO', updated_at = NOW() WHERE vektus_file_id = $1`,
      [fileId],
    );
    this.logger.log(`File deleted: ${fileId}`);
  }
}
