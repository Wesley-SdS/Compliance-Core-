import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService, DatabaseService, ComplianceLogger } from '@compliancecore/sdk';

import { UpdateInfraestruturaDto, UploadEvidenciaDto } from './infraestrutura.dto';
export { UpdateInfraestruturaDto, UploadEvidenciaDto };

@Injectable()
export class InfraestruturaService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('InfraestruturaService');
  }

  async getByLoteamento(loteamentoId: string) {
    const items = await this.db.query(
      `SELECT * FROM infraestrutura_itens WHERE loteamento_id = $1 ORDER BY item`,
      [loteamentoId],
    );

    if (items.length === 0) {
      // Return default items with 0% if none exist
      const defaultItems = ['agua', 'esgoto', 'energia', 'pavimentacao', 'drenagem', 'iluminacao'];
      return defaultItems.map(item => ({
        loteamento_id: loteamentoId,
        item,
        percentual: 0,
        responsavel: null,
        prazo: null,
        observacoes: null,
      }));
    }

    return items;
  }

  async update(loteamentoId: string, dto: UpdateInfraestruturaDto, actorId: string) {
    const existing = await this.db.queryOne(
      `SELECT * FROM infraestrutura_itens WHERE loteamento_id = $1 AND item = $2`,
      [loteamentoId, dto.item],
    );

    if (existing) {
      await this.db.query(
        `UPDATE infraestrutura_itens SET percentual = $1, responsavel = $2, prazo = $3,
          observacoes = $4, updated_at = NOW()
         WHERE loteamento_id = $5 AND item = $6`,
        [dto.percentual, dto.responsavel || null, dto.prazo || null,
          dto.observacoes || null, loteamentoId, dto.item],
      );
    } else {
      const id = ulid();
      await this.db.query(
        `INSERT INTO infraestrutura_itens (id, loteamento_id, item, percentual, responsavel, prazo,
          observacoes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [id, loteamentoId, dto.item, dto.percentual, dto.responsavel || null,
          dto.prazo || null, dto.observacoes || null],
      );
    }

    await this.eventStore.append(loteamentoId, 'loteamento', 'INFRAESTRUTURA_UPDATED', {
      item: dto.item, percentual: dto.percentual,
    }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.getByLoteamento(loteamentoId);
  }

  async uploadEvidencia(loteamentoId: string, dto: UploadEvidenciaDto, actorId: string) {
    const id = ulid();

    await this.db.query(
      `INSERT INTO infraestrutura_evidencias (id, loteamento_id, item, descricao, file_name, content,
        created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [id, loteamentoId, dto.item, dto.descricao, dto.fileName, dto.content],
    );

    await this.eventStore.append(loteamentoId, 'loteamento', 'INFRAESTRUTURA_EVIDENCIA_UPLOADED', {
      evidenciaId: id, item: dto.item, fileName: dto.fileName,
    }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return { id, loteamentoId, item: dto.item, descricao: dto.descricao, fileName: dto.fileName };
  }
}
