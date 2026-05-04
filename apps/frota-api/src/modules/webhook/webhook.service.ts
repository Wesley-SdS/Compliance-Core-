import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService, DatabaseService, ComplianceLogger } from '@compliancecore/sdk';

@Injectable()
export class WebhookService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('WebhookService');
  }

  async processOcrResult(fileId: string, ocrData: Record<string, any>) {
    const abastecimento = await this.db.queryOne<{ id: string }>(
      `SELECT id FROM abastecimentos WHERE id = $1 OR arquivo_id = $1`,
      [fileId],
    );

    if (!abastecimento) {
      this.logger.warn(`Abastecimento not found for fileId: ${fileId}`);
      return { status: 'NOT_FOUND', fileId };
    }

    await this.db.query(
      `UPDATE abastecimentos SET status_ocr = 'CONCLUIDO', dados_ocr = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(ocrData), abastecimento.id],
    );

    await this.eventStore.append(
      abastecimento.id,
      'abastecimento',
      'OCR_PROCESSADO',
      { fileId, ocrData },
      {
        actorId: 'system:vektus',
        actorRole: 'webhook',
        ip: '0.0.0.0',
        correlationId: ulid(),
      },
    );

    this.logger.log(`OCR processed for abastecimento: ${abastecimento.id}`, {
      abastecimentoId: abastecimento.id,
      fileId,
    });

    return { status: 'OK', abastecimentoId: abastecimento.id };
  }
}
