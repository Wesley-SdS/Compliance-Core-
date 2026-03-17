import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import {
  EventStoreService,
  VektusAdapterService,
  DatabaseService,
  ComplianceLogger,
} from '@compliancecore/sdk';
import { UploadNotaFiscalDto } from '../obra.dto';

@Injectable()
export class RegistrarNotaFiscalUseCase {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly vektus: VektusAdapterService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('RegistrarNotaFiscalUseCase');
  }

  async execute(obraId: string, dto: UploadNotaFiscalDto, actorId: string) {
    // Validate obra exists
    const obra = await this.db.queryOne(`SELECT id FROM obras WHERE id = $1`, [obraId]);
    if (!obra) throw new Error(`Obra ${obraId} nao encontrada`);

    const nfId = ulid();

    // Ingest via Vektus for OCR
    const ingestResult = await this.vektus.ingest(dto.imagemUrl, {
      fileName: `nf_${nfId}.jpg`,
      vertical: 'obra',
      category: 'nota_fiscal_material',
      tags: ['obra', obraId, 'nota_fiscal'],
    });

    await this.db.query(
      `INSERT INTO notas_fiscais (id, obra_id, imagem_url, status_ocr, vektus_file_id, created_at, updated_at)
       VALUES ($1, $2, $3, 'PENDENTE', $4, NOW(), NOW())`,
      [nfId, obraId, dto.imagemUrl, ingestResult.fileId],
    );

    await this.eventStore.append(obraId, 'obra', 'NF_UPLOADED', {
      notaFiscalId: nfId, vektusFileId: ingestResult.fileId,
    }, { actorId, actorRole: 'construtor', ip: '0.0.0.0', correlationId: ulid() });

    this.logger.log(`NF uploaded: ${nfId} for obra ${obraId}`);

    return { id: nfId, status: 'PENDENTE', vektusFileId: ingestResult.fileId };
  }
}
