import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService } from '@compliancecore/sdk/event-store/event-store.service';
import { ScoreEngineService } from '@compliancecore/sdk/score-engine/score-engine.service';
import { VektusAdapterService } from '@compliancecore/sdk/vektus/vektus-adapter.service';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';
import { TRIBUTO_CRITERIA, TRIBUTO_DOC_CATEGORIES } from '../../config/tributo.config';
import { CreateEmpresaDto, UpdateEmpresaDto } from './empresa.dto';

@Injectable()
export class EmpresaService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly scoreEngine: ScoreEngineService,
    private readonly vektus: VektusAdapterService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('EmpresaService');
  }

  async create(dto: CreateEmpresaDto, actorId: string) {
    const id = ulid();

    await this.db.query(
      `INSERT INTO empresas (id, razao_social, nome_fantasia, cnpj, inscricao_estadual, inscricao_municipal,
        regime_tributario, cnae_principal, endereco, email, telefone, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ATIVA', NOW(), NOW())`,
      [id, dto.razaoSocial, dto.nomeFantasia, dto.cnpj, dto.inscricaoEstadual || null,
        dto.inscricaoMunicipal || null, dto.regimeTributario, dto.cnaePrincipal || null,
        dto.endereco || null, dto.email || null, dto.telefone || null],
    );

    await this.eventStore.append(id, 'empresa', 'EMPRESA_CREATED', { ...dto }, {
      actorId, actorRole: 'contador', ip: '0.0.0.0', correlationId: ulid(),
    });

    this.logger.log(`Empresa created: ${id}`, { empresaId: id });
    return this.findById(id);
  }

  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows, countResult] = await Promise.all([
      this.db.query(`SELECT * FROM empresas ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]),
      this.db.queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM empresas`),
    ]);
    const total = parseInt(countResult?.count ?? '0', 10);
    return { data: rows, total, page, limit, hasMore: offset + rows.length < total };
  }

  async findById(id: string) {
    const empresa = await this.db.queryOne(`SELECT * FROM empresas WHERE id = $1`, [id]);
    if (!empresa) throw new NotFoundException(`Empresa ${id} nao encontrada`);
    return empresa;
  }

  async update(id: string, dto: UpdateEmpresaDto, actorId: string) {
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

    await this.db.query(`UPDATE empresas SET ${fields.join(', ')} WHERE id = $${idx}`, values);

    await this.eventStore.append(id, 'empresa', 'EMPRESA_UPDATED', { changes: dto }, {
      actorId, actorRole: 'contador', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }

  async delete(id: string, actorId: string) {
    await this.findById(id);
    await this.db.query(`DELETE FROM empresas WHERE id = $1`, [id]);

    await this.eventStore.append(id, 'empresa', 'EMPRESA_DELETED', {}, {
      actorId, actorRole: 'contador', ip: '0.0.0.0', correlationId: ulid(),
    });
  }

  async calculateScore(id: string) {
    const empresa = await this.findById(id);
    const documents = await this.db.query(
      `SELECT * FROM documents WHERE aggregate_id = $1 AND aggregate_type = 'empresa'`, [id],
    );
    const spedFiles = await this.db.query(
      `SELECT * FROM sped_files WHERE empresa_id = $1`, [id],
    );
    const obrigacoes = await this.db.query(
      `SELECT * FROM obrigacoes_acessorias WHERE empresa_id = $1`, [id],
    );

    const entity = { ...empresa, documents, spedFiles, obrigacoes };
    return this.scoreEngine.calculate(id, TRIBUTO_CRITERIA, entity);
  }

  async getDocuments(id: string) {
    await this.findById(id);
    return this.db.query(
      `SELECT * FROM documents WHERE aggregate_id = $1 AND aggregate_type = 'empresa' ORDER BY created_at DESC`, [id],
    );
  }

  async uploadDocument(id: string, file: { fileName: string; content: string; category: string }, actorId: string) {
    await this.findById(id);
    const docId = ulid();

    const ingestResult = await this.vektus.ingest(file.content, {
      fileName: file.fileName, vertical: 'tributo', category: file.category, tags: ['empresa', id],
    });

    await this.db.query(
      `INSERT INTO documents (id, aggregate_id, aggregate_type, vertical, file_name, file_key, file_size, mime_type, category, vektus_file_id, version, uploaded_by, created_at, updated_at)
       VALUES ($1, $2, 'empresa', 'tributo', $3, $4, $5, 'application/octet-stream', $6, $7, 1, $8, NOW(), NOW())`,
      [docId, id, file.fileName, `tributo/${id}/${docId}`, file.content.length, file.category, ingestResult.fileId, actorId],
    );

    await this.eventStore.append(id, 'empresa', 'DOCUMENT_UPLOADED', { docId, category: file.category, fileName: file.fileName }, {
      actorId, actorRole: 'contador', ip: '0.0.0.0', correlationId: ulid(),
    });

    return { docId, vektusFileId: ingestResult.fileId, status: ingestResult.status };
  }

  async getAlerts(id: string) {
    await this.findById(id);
    return this.db.query(
      `SELECT * FROM alerts WHERE entity_id = $1 AND entity_type = 'empresa' AND status != 'EXPIRED' ORDER BY due_date ASC`, [id],
    );
  }

  async getChecklist(id: string) {
    await this.findById(id);
    return this.db.query(
      `SELECT * FROM checklists WHERE aggregate_id = $1 AND entity_type = 'empresa' ORDER BY created_at DESC LIMIT 1`, [id],
    );
  }

  async getDossier(id: string) {
    const empresa = await this.findById(id);
    const [documents, score, alerts, spedFiles] = await Promise.all([
      this.getDocuments(id),
      this.calculateScore(id).catch(() => null),
      this.getAlerts(id),
      this.db.query(`SELECT * FROM sped_files WHERE empresa_id = $1 ORDER BY competencia DESC`, [id]),
    ]);

    return {
      empresa, documents, score, alerts, spedFiles,
      docCategories: TRIBUTO_DOC_CATEGORIES,
      generatedAt: new Date(),
    };
  }

  async getTimeline(id: string, page = 1, limit = 50) {
    await this.findById(id);
    return this.eventStore.getAuditTrail({
      aggregateId: id, aggregateType: 'empresa', page, limit,
    });
  }
}
