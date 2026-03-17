import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService } from '@compliancecore/sdk/event-store/event-store.service';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';

import { CreateEtapaDto, UpdateEtapaDto } from './etapa.dto';
export { CreateEtapaDto, UpdateEtapaDto };

@Injectable()
export class EtapaService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('EtapaService');
  }

  async create(dto: CreateEtapaDto, actorId: string) {
    const id = ulid();

    await this.db.query(
      `INSERT INTO etapas (id, obra_id, nome, tipo, ordem, inicio_previsao, fim_previsao, descricao, status, percentual_concluido, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDENTE', 0, NOW(), NOW())`,
      [id, dto.obraId, dto.nome, dto.tipo, dto.ordem, dto.inicioPrevisao, dto.fimPrevisao, dto.descricao || null],
    );

    await this.eventStore.append(dto.obraId, 'obra', 'ETAPA_CREATED', { etapaId: id, ...dto }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }

  async findByObra(obraId: string) {
    return this.db.query(`SELECT * FROM etapas WHERE obra_id = $1 ORDER BY ordem ASC`, [obraId]);
  }

  async findById(id: string) {
    const etapa = await this.db.queryOne(`SELECT * FROM etapas WHERE id = $1`, [id]);
    if (!etapa) throw new NotFoundException(`Etapa ${id} nao encontrada`);
    return etapa;
  }

  async update(id: string, dto: UpdateEtapaDto, actorId: string) {
    const etapa = await this.findById(id);
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${col} = $${idx}`);
        values.push(value);
        idx++;
      }
    }

    if (fields.length === 0) return etapa;

    fields.push(`updated_at = $${idx}`);
    values.push(new Date());
    idx++;
    values.push(id);

    await this.db.query(`UPDATE etapas SET ${fields.join(', ')} WHERE id = $${idx}`, values);

    await this.eventStore.append(etapa.obra_id, 'obra', 'ETAPA_UPDATED', { etapaId: id, changes: dto }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }

  async delete(id: string, actorId: string) {
    const etapa = await this.findById(id);
    await this.db.query(`DELETE FROM etapas WHERE id = $1`, [id]);

    await this.eventStore.append(etapa.obra_id, 'obra', 'ETAPA_DELETED', { etapaId: id }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });
  }

  async getComplianceByEtapa(obraId: string) {
    const etapas = await this.findByObra(obraId);
    const results = [];

    for (const etapa of etapas) {
      const docs = await this.db.query(
        `SELECT * FROM documents WHERE aggregate_id = $1 AND aggregate_type = 'etapa'`,
        [etapa.id],
      );
      results.push({
        etapa,
        documentsCount: docs.length,
        hasRequiredDocs: docs.length > 0,
        complianceStatus: etapa.percentual_concluido === 100 ? 'CONCLUIDA' : etapa.status,
      });
    }

    return results;
  }
}
