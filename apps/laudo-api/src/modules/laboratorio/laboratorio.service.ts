import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService } from '@compliancecore/sdk/event-store/event-store.service';
import { ScoreEngineService } from '@compliancecore/sdk/score-engine/score-engine.service';
import { VektusAdapterService } from '@compliancecore/sdk/vektus/vektus-adapter.service';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';
import { LAUDO_CRITERIA, LAUDO_DOC_CATEGORIES } from '../../config/laudo.config';

import { CreateLaboratorioDto, UpdateLaboratorioDto } from './laboratorio.dto';
export { CreateLaboratorioDto, UpdateLaboratorioDto };

@Injectable()
export class LaboratorioService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly scoreEngine: ScoreEngineService,
    private readonly vektus: VektusAdapterService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('LaboratorioService');
  }

  async create(dto: CreateLaboratorioDto, actorId: string) {
    const id = ulid();

    await this.db.query(
      `INSERT INTO laboratorios (id, nome, cnpj, endereco, responsavel_tecnico, crbm,
        tipo_laboratorio, especialidades, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ATIVO', NOW(), NOW())`,
      [id, dto.nome, dto.cnpj, dto.endereco, dto.responsavelTecnico, dto.crbm || null,
        dto.tipoLaboratorio, JSON.stringify(dto.especialidades || [])],
    );

    await this.eventStore.append(id, 'laboratorio', 'LABORATORIO_CREATED', { ...dto }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    this.logger.log(`Laboratorio created: ${id}`, { labId: id });
    return this.findById(id);
  }

  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows, countResult] = await Promise.all([
      this.db.query(`SELECT * FROM laboratorios ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]),
      this.db.queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM laboratorios`),
    ]);
    const total = parseInt(countResult?.count ?? '0', 10);
    return { data: rows, total, page, limit, hasMore: offset + rows.length < total };
  }

  async findById(id: string) {
    const lab = await this.db.queryOne(`SELECT * FROM laboratorios WHERE id = $1`, [id]);
    if (!lab) throw new NotFoundException(`Laboratorio ${id} nao encontrado`);
    return lab;
  }

  async update(id: string, dto: UpdateLaboratorioDto, actorId: string) {
    await this.findById(id);
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (Array.isArray(value)) {
          fields.push(`${col} = $${idx}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${col} = $${idx}`);
          values.push(value);
        }
        idx++;
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = $${idx}`);
    values.push(new Date());
    idx++;
    values.push(id);

    await this.db.query(`UPDATE laboratorios SET ${fields.join(', ')} WHERE id = $${idx}`, values);

    await this.eventStore.append(id, 'laboratorio', 'LABORATORIO_UPDATED', { changes: dto }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }

  async delete(id: string, actorId: string) {
    await this.findById(id);
    await this.db.query(`DELETE FROM laboratorios WHERE id = $1`, [id]);

    await this.eventStore.append(id, 'laboratorio', 'LABORATORIO_DELETED', {}, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });
  }

  async calculateScore(id: string) {
    const lab = await this.findById(id);
    const [documents, equipamentos] = await Promise.all([
      this.db.query(`SELECT * FROM documents WHERE aggregate_id = $1 AND aggregate_type = 'laboratorio'`, [id]),
      this.db.query(`SELECT * FROM equipamentos WHERE laboratorio_id = $1`, [id]),
    ]);

    const entity = { ...lab, documents, equipamentos };
    return this.scoreEngine.calculate(id, LAUDO_CRITERIA, entity);
  }

  async getDocuments(id: string) {
    await this.findById(id);
    return this.db.query(
      `SELECT * FROM documents WHERE aggregate_id = $1 AND aggregate_type = 'laboratorio' ORDER BY created_at DESC`, [id],
    );
  }

  async uploadDocument(id: string, file: { fileName: string; content: string; category: string }, actorId: string) {
    await this.findById(id);
    const docId = ulid();

    const ingestResult = await this.vektus.ingest(file.content, {
      fileName: file.fileName, vertical: 'laudo', category: file.category, tags: ['laboratorio', id],
    });

    await this.db.query(
      `INSERT INTO documents (id, aggregate_id, aggregate_type, vertical, file_name, file_key, file_size, mime_type, category, vektus_file_id, version, uploaded_by, created_at, updated_at)
       VALUES ($1, $2, 'laboratorio', 'laudo', $3, $4, $5, 'application/octet-stream', $6, $7, 1, $8, NOW(), NOW())`,
      [docId, id, file.fileName, `laudo/${id}/${docId}`, file.content.length, file.category, ingestResult.fileId, actorId],
    );

    await this.eventStore.append(id, 'laboratorio', 'DOCUMENT_UPLOADED', { docId, category: file.category, fileName: file.fileName }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return { docId, vektusFileId: ingestResult.fileId, status: ingestResult.status };
  }

  async getAlerts(id: string) {
    await this.findById(id);
    return this.db.query(
      `SELECT * FROM alerts WHERE entity_id = $1 AND entity_type = 'laboratorio' AND status != 'EXPIRED' ORDER BY due_date ASC`, [id],
    );
  }

  async getChecklist(id: string) {
    await this.findById(id);
    return this.db.query(
      `SELECT * FROM checklists WHERE aggregate_id = $1 AND entity_type = 'laboratorio' ORDER BY created_at DESC LIMIT 1`, [id],
    );
  }

  async getDossier(id: string) {
    const lab = await this.findById(id);
    const [documents, score, alerts, equipamentos, laudos] = await Promise.all([
      this.getDocuments(id),
      this.calculateScore(id).catch(() => null),
      this.getAlerts(id),
      this.db.query(`SELECT * FROM equipamentos WHERE laboratorio_id = $1`, [id]),
      this.db.query(`SELECT * FROM laudos WHERE laboratorio_id = $1 ORDER BY created_at DESC LIMIT 50`, [id]),
    ]);

    return {
      laboratorio: lab, documents, score, alerts, equipamentos, laudos,
      docCategories: LAUDO_DOC_CATEGORIES, generatedAt: new Date(),
    };
  }

  async getTimeline(id: string, page = 1, limit = 50) {
    await this.findById(id);
    return this.eventStore.getAuditTrail({
      aggregateId: id, aggregateType: 'laboratorio', page, limit,
    });
  }
}
