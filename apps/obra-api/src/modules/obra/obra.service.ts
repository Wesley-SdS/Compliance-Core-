import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService } from '@compliancecore/sdk/event-store/event-store.service';
import { ScoreEngineService } from '@compliancecore/sdk/score-engine/score-engine.service';
import { VektusAdapterService } from '@compliancecore/sdk/vektus/vektus-adapter.service';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';
import { OBRA_CRITERIA, OBRA_DOC_CATEGORIES } from '../../config/obra.config';
import { CreateObraDto, UpdateObraDto } from './obra.dto';

@Injectable()
export class ObraService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly scoreEngine: ScoreEngineService,
    private readonly vektus: VektusAdapterService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('ObraService');
  }

  async create(dto: CreateObraDto, actorId: string) {
    const id = ulid();
    const now = new Date();

    await this.db.query(
      `INSERT INTO obras (id, nome, endereco, responsavel, tipo_obra, area_m2, numero_pavimentos,
        inicio_previsao, fim_previsao, cnpj_construtora, crea_responsavel, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PLANEJAMENTO', $12, $12)`,
      [id, dto.nome, dto.endereco, dto.responsavel, dto.tipoObra, dto.areaM2,
        dto.numeroPavimentos, dto.inicioPrevisao, dto.fimPrevisao,
        dto.cnpjConstrutora || null, dto.creaResponsavel || null, now],
    );

    await this.eventStore.append(id, 'obra', 'OBRA_CREATED', { ...dto }, {
      actorId,
      actorRole: 'admin',
      ip: '0.0.0.0',
      correlationId: ulid(),
    });

    this.logger.log(`Obra created: ${id}`, { obraId: id });
    return this.findById(id);
  }

  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows, countResult] = await Promise.all([
      this.db.query(
        `SELECT * FROM obras ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      this.db.queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM obras`),
    ]);
    const total = parseInt(countResult?.count ?? '0', 10);
    return { data: rows, total, page, limit, hasMore: offset + rows.length < total };
  }

  async findById(id: string) {
    const obra = await this.db.queryOne(`SELECT * FROM obras WHERE id = $1`, [id]);
    if (!obra) throw new NotFoundException(`Obra ${id} nao encontrada`);
    return obra;
  }

  async update(id: string, dto: UpdateObraDto, actorId: string) {
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

    await this.db.query(
      `UPDATE obras SET ${fields.join(', ')} WHERE id = $${idx}`,
      values,
    );

    await this.eventStore.append(id, 'obra', 'OBRA_UPDATED', { changes: dto }, {
      actorId,
      actorRole: 'admin',
      ip: '0.0.0.0',
      correlationId: ulid(),
    });

    return this.findById(id);
  }

  async delete(id: string, actorId: string) {
    await this.findById(id);
    await this.db.query(`DELETE FROM obras WHERE id = $1`, [id]);

    await this.eventStore.append(id, 'obra', 'OBRA_DELETED', {}, {
      actorId,
      actorRole: 'admin',
      ip: '0.0.0.0',
      correlationId: ulid(),
    });
  }

  async calculateScore(id: string) {
    const obra = await this.findById(id);
    const documents = await this.db.query(
      `SELECT * FROM documents WHERE aggregate_id = $1 AND aggregate_type = 'obra'`,
      [id],
    );
    const trabalhadores = await this.db.query(
      `SELECT * FROM obra_trabalhadores WHERE obra_id = $1`,
      [id],
    );

    const entity = { ...obra, documents, trabalhadores };
    return this.scoreEngine.calculate(id, OBRA_CRITERIA, entity);
  }

  async getDocuments(id: string) {
    await this.findById(id);
    return this.db.query(
      `SELECT * FROM documents WHERE aggregate_id = $1 AND aggregate_type = 'obra' ORDER BY created_at DESC`,
      [id],
    );
  }

  async uploadDocument(id: string, file: { fileName: string; content: string; category: string }, actorId: string) {
    await this.findById(id);
    const docId = ulid();

    const ingestResult = await this.vektus.ingest(file.content, {
      fileName: file.fileName,
      vertical: 'obra',
      category: file.category,
      tags: ['obra', id],
    });

    await this.db.query(
      `INSERT INTO documents (id, aggregate_id, aggregate_type, vertical, file_name, file_key, file_size, mime_type, category, vektus_file_id, version, uploaded_by, created_at, updated_at)
       VALUES ($1, $2, 'obra', 'obra', $3, $4, $5, 'application/octet-stream', $6, $7, 1, $8, NOW(), NOW())`,
      [docId, id, file.fileName, `obra/${id}/${docId}`, file.content.length, file.category, ingestResult.fileId, actorId],
    );

    await this.eventStore.append(id, 'obra', 'DOCUMENT_UPLOADED', { docId, category: file.category, fileName: file.fileName }, {
      actorId,
      actorRole: 'admin',
      ip: '0.0.0.0',
      correlationId: ulid(),
    });

    return { docId, vektusFileId: ingestResult.fileId, status: ingestResult.status };
  }

  async getAlerts(id: string) {
    await this.findById(id);
    return this.db.query(
      `SELECT * FROM alerts WHERE entity_id = $1 AND entity_type = 'obra' AND status != 'EXPIRED' ORDER BY due_date ASC`,
      [id],
    );
  }

  async getChecklist(id: string) {
    await this.findById(id);
    return this.db.query(
      `SELECT * FROM checklists WHERE aggregate_id = $1 AND entity_type = 'obra' ORDER BY created_at DESC LIMIT 1`,
      [id],
    );
  }

  async getDossier(id: string) {
    const obra = await this.findById(id);
    const [documents, score, alerts, etapas] = await Promise.all([
      this.getDocuments(id),
      this.calculateScore(id).catch(() => null),
      this.getAlerts(id),
      this.db.query(`SELECT * FROM etapas WHERE obra_id = $1 ORDER BY ordem ASC`, [id]),
    ]);

    return {
      obra,
      documents,
      score,
      alerts,
      etapas,
      docCategories: OBRA_DOC_CATEGORIES,
      generatedAt: new Date(),
    };
  }

  async getTimeline(id: string, page = 1, limit = 50) {
    await this.findById(id);
    return this.eventStore.getAuditTrail({
      aggregateId: id,
      aggregateType: 'obra',
      page,
      limit,
    });
  }
}
