import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService, ScoreEngineService, VektusAdapterService, DatabaseService, ComplianceLogger } from '@compliancecore/sdk';
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

  async getStats(id: string) {
    await this.findById(id);

    const [laudosHoje, pendentes, revisados, liberadosHoje, tempoMedio, volumePorDia, distribuicao, eqVencidos] = await Promise.all([
      this.db.queryOne<{count:string}>(`SELECT COUNT(*) as count FROM laudos WHERE laboratorio_id=$1 AND created_at::date=CURRENT_DATE`, [id]),
      this.db.queryOne<{count:string}>(`SELECT COUNT(*) as count FROM laudos WHERE laboratorio_id=$1 AND status IN ('RASCUNHO','EM_REVISAO')`, [id]),
      this.db.queryOne<{count:string}>(`SELECT COUNT(*) as count FROM laudos WHERE laboratorio_id=$1 AND status='REVISADO'`, [id]),
      this.db.queryOne<{count:string}>(`SELECT COUNT(*) as count FROM laudos WHERE laboratorio_id=$1 AND status='LIBERADO' AND created_at::date=CURRENT_DATE`, [id]),
      this.db.queryOne<{horas:string}>(`SELECT AVG(EXTRACT(EPOCH FROM (liberado_at-created_at))/3600) as horas FROM laudos WHERE laboratorio_id=$1 AND liberado_at IS NOT NULL AND created_at>NOW()-INTERVAL '30 days'`, [id]),
      this.db.query(`SELECT created_at::date as data,COUNT(*) as quantidade FROM laudos WHERE laboratorio_id=$1 AND created_at>NOW()-INTERVAL '30 days' GROUP BY created_at::date ORDER BY data`, [id]),
      this.db.query(`SELECT tipo_exame as tipo,COUNT(*) as quantidade FROM laudos WHERE laboratorio_id=$1 AND created_at>NOW()-INTERVAL '30 days' GROUP BY tipo_exame ORDER BY quantidade DESC`, [id]),
      this.db.queryOne<{count:string}>(`SELECT COUNT(*) as count FROM equipamentos WHERE laboratorio_id=$1 AND proxima_calibracao<NOW()`, [id]),
    ]);

    return {
      laudosHoje: parseInt(laudosHoje?.count ?? '0', 10),
      laudosPendentes: parseInt(pendentes?.count ?? '0', 10),
      laudosRevisados: parseInt(revisados?.count ?? '0', 10),
      laudosLiberados: parseInt(liberadosHoje?.count ?? '0', 10),
      tempoMedioLiberacao: parseFloat(tempoMedio?.horas ?? '0') || 0,
      valoresCriticosHoje: 0,
      equipamentosVencidos: parseInt(eqVencidos?.count ?? '0', 10),
      volumePorDia: volumePorDia || [],
      distribuicaoPorExame: distribuicao || [],
    };
  }

  async acknowledgeAlert(alertId: string, actorId: string) {
    const alert = await this.db.queryOne(`SELECT * FROM alerts WHERE id=$1`, [alertId]);
    if (!alert) throw new NotFoundException(`Alert ${alertId} not found`);
    await this.db.query(`UPDATE alerts SET status='ACKNOWLEDGED',updated_at=NOW() WHERE id=$1`, [alertId]);
    await this.eventStore.append(alert.entity_id, 'laboratorio', 'ALERT_ACKNOWLEDGED', { alertId }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });
    return { success: true };
  }

  async getConfiguracoes(id: string) {
    const lab = await this.findById(id);
    return {
      nome: lab.nome,
      cnpj: lab.cnpj,
      crbm: lab.crbm,
      responsavelTecnico: lab.responsavel_tecnico,
      tipoLaboratorio: lab.tipo_laboratorio,
      endereco: lab.endereco,
      slaHoras: lab.sla_horas ?? 24,
      logoUrl: lab.logo_url ?? null,
    };
  }

  async updateConfiguracoes(id: string, dto: { nome?: string; cnpj?: string; crbm?: string; slaHoras?: number; logoUrl?: string }, actorId: string) {
    await this.findById(id);
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (dto.nome !== undefined) { fields.push(`nome = $${idx}`); values.push(dto.nome); idx++; }
    if (dto.cnpj !== undefined) { fields.push(`cnpj = $${idx}`); values.push(dto.cnpj); idx++; }
    if (dto.crbm !== undefined) { fields.push(`crbm = $${idx}`); values.push(dto.crbm); idx++; }
    if (dto.slaHoras !== undefined) { fields.push(`sla_horas = $${idx}`); values.push(dto.slaHoras); idx++; }
    if (dto.logoUrl !== undefined) { fields.push(`logo_url = $${idx}`); values.push(dto.logoUrl); idx++; }

    if (fields.length === 0) return this.getConfiguracoes(id);

    fields.push(`updated_at = $${idx}`); values.push(new Date()); idx++;
    values.push(id);

    await this.db.query(`UPDATE laboratorios SET ${fields.join(', ')} WHERE id = $${idx}`, values);

    await this.eventStore.append(id, 'laboratorio', 'CONFIG_UPDATED', { changes: dto }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.getConfiguracoes(id);
  }
}
