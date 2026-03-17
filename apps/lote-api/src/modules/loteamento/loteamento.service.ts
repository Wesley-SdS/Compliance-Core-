import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService } from '@compliancecore/sdk/event-store/event-store.service';
import { ScoreEngineService } from '@compliancecore/sdk/score-engine/score-engine.service';
import { VektusAdapterService } from '@compliancecore/sdk/vektus/vektus-adapter.service';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';
import { LOTE_CRITERIA, LOTE_DOC_CATEGORIES } from '../../config/lote.config';

import { CreateLoteamentoDto, UpdateLoteamentoDto } from './loteamento.dto';
export { CreateLoteamentoDto, UpdateLoteamentoDto };

@Injectable()
export class LoteamentoService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly scoreEngine: ScoreEngineService,
    private readonly vektus: VektusAdapterService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('LoteamentoService');
  }

  async create(dto: CreateLoteamentoDto, actorId: string) {
    const id = ulid();

    await this.db.query(
      `INSERT INTO loteamentos (id, nome, endereco, cidade, estado, area_total, total_lotes,
        matricula_numero, registro_cartorio, aprovacao_prefeitura, responsavel, cnpj_loteador,
        status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'EM_IMPLANTACAO', NOW(), NOW())`,
      [id, dto.nome, dto.endereco, dto.cidade, dto.estado, dto.areaTotal, dto.totalLotes,
        dto.matriculaNumero || null, dto.registroCartorio ?? false,
        dto.aprovacaoPrefeitura ?? false, dto.responsavel, dto.cnpjLoteador],
    );

    await this.eventStore.append(id, 'loteamento', 'LOTEAMENTO_CREATED', { ...dto }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    this.logger.log(`Loteamento created: ${id}`, { loteamentoId: id });
    return this.findById(id);
  }

  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows, countResult] = await Promise.all([
      this.db.query(`SELECT * FROM loteamentos ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]),
      this.db.queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM loteamentos`),
    ]);
    const total = parseInt(countResult?.count ?? '0', 10);
    return { data: rows, total, page, limit, hasMore: offset + rows.length < total };
  }

  async findById(id: string) {
    const loteamento = await this.db.queryOne(`SELECT * FROM loteamentos WHERE id = $1`, [id]);
    if (!loteamento) throw new NotFoundException(`Loteamento ${id} nao encontrado`);
    return loteamento;
  }

  async update(id: string, dto: UpdateLoteamentoDto, actorId: string) {
    await this.findById(id);
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

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = $${idx}`);
    values.push(new Date());
    idx++;
    values.push(id);

    await this.db.query(`UPDATE loteamentos SET ${fields.join(', ')} WHERE id = $${idx}`, values);

    await this.eventStore.append(id, 'loteamento', 'LOTEAMENTO_UPDATED', { changes: dto }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }

  async delete(id: string, actorId: string) {
    await this.findById(id);
    await this.db.query(`DELETE FROM loteamentos WHERE id = $1`, [id]);

    await this.eventStore.append(id, 'loteamento', 'LOTEAMENTO_DELETED', {}, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });
  }

  async calculateScore(id: string) {
    const loteamento = await this.findById(id);
    const [documents, compradores, lotes] = await Promise.all([
      this.db.query(`SELECT * FROM documents WHERE aggregate_id = $1 AND aggregate_type = 'loteamento'`, [id]),
      this.db.query(`SELECT * FROM compradores WHERE loteamento_id = $1`, [id]),
      this.db.query(`SELECT * FROM lotes WHERE loteamento_id = $1`, [id]),
    ]);

    const contratos = lotes.filter((l: any) => l.comprador_id).map((l: any) => ({
      registrado: l.contrato_registrado,
    }));

    const entity = { ...loteamento, documents, compradores, contratos };
    return this.scoreEngine.calculate(id, LOTE_CRITERIA, entity);
  }

  async getDocuments(id: string) {
    await this.findById(id);
    return this.db.query(
      `SELECT * FROM documents WHERE aggregate_id = $1 AND aggregate_type = 'loteamento' ORDER BY created_at DESC`, [id],
    );
  }

  async uploadDocument(id: string, file: { fileName: string; content: string; category: string }, actorId: string) {
    await this.findById(id);
    const docId = ulid();

    const ingestResult = await this.vektus.ingest(file.content, {
      fileName: file.fileName, vertical: 'lote', category: file.category, tags: ['loteamento', id],
    });

    await this.db.query(
      `INSERT INTO documents (id, aggregate_id, aggregate_type, vertical, file_name, file_key, file_size, mime_type, category, vektus_file_id, version, uploaded_by, created_at, updated_at)
       VALUES ($1, $2, 'loteamento', 'lote', $3, $4, $5, 'application/octet-stream', $6, $7, 1, $8, NOW(), NOW())`,
      [docId, id, file.fileName, `lote/${id}/${docId}`, file.content.length, file.category, ingestResult.fileId, actorId],
    );

    await this.eventStore.append(id, 'loteamento', 'DOCUMENT_UPLOADED', { docId, category: file.category }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return { docId, vektusFileId: ingestResult.fileId, status: ingestResult.status };
  }

  async getAlerts(id: string) {
    await this.findById(id);
    return this.db.query(
      `SELECT * FROM alerts WHERE entity_id = $1 AND entity_type = 'loteamento' AND status != 'EXPIRED' ORDER BY due_date ASC`, [id],
    );
  }

  async getChecklist(id: string) {
    await this.findById(id);
    return this.db.query(
      `SELECT * FROM checklists WHERE aggregate_id = $1 AND entity_type = 'loteamento' ORDER BY created_at DESC LIMIT 1`, [id],
    );
  }

  async getDossier(id: string) {
    const loteamento = await this.findById(id);
    const [documents, score, alerts, lotes, compradores] = await Promise.all([
      this.getDocuments(id),
      this.calculateScore(id).catch(() => null),
      this.getAlerts(id),
      this.db.query(`SELECT * FROM lotes WHERE loteamento_id = $1 ORDER BY quadra, numero`, [id]),
      this.db.query(`SELECT * FROM compradores WHERE loteamento_id = $1`, [id]),
    ]);

    return {
      loteamento, documents, score, alerts, lotes, compradores,
      docCategories: LOTE_DOC_CATEGORIES, generatedAt: new Date(),
    };
  }

  async getTimeline(id: string, page = 1, limit = 50) {
    await this.findById(id);
    return this.eventStore.getAuditTrail({
      aggregateId: id, aggregateType: 'loteamento', page, limit,
    });
  }
}
