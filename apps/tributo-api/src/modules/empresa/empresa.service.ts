import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService, ScoreEngineService, VektusAdapterService, EvidenceGeneratorService, DatabaseService, ComplianceLogger } from '@compliancecore/sdk';
import { TRIBUTO_CRITERIA, TRIBUTO_DOC_CATEGORIES } from '../../config/tributo.config';
import { CreateEmpresaDto, UpdateEmpresaDto } from './empresa.dto';

@Injectable()
export class EmpresaService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly scoreEngine: ScoreEngineService,
    private readonly vektus: VektusAdapterService,
    private readonly evidenceGenerator: EvidenceGeneratorService,
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

  async findAll(page = 1, limit = 20, filters?: { search?: string; regime?: string }) {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (filters?.search) {
      conditions.push(`(razao_social ILIKE $${idx} OR cnpj ILIKE $${idx} OR nome_fantasia ILIKE $${idx})`);
      values.push(`%${filters.search}%`);
      idx++;
    }
    if (filters?.regime) {
      conditions.push(`regime_tributario = $${idx}`);
      values.push(filters.regime);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    values.push(limit, offset);
    const [rows, countResult] = await Promise.all([
      this.db.query(`SELECT * FROM empresas ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`, values),
      this.db.queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM empresas ${where}`, values.slice(0, -2)),
    ]);
    const total = parseInt(countResult?.count ?? '0', 10);
    return { data: rows, total, page, limit, hasMore: offset + rows.length < total };
  }

  async getGlobalScore() {
    const empresas = await this.db.query(`SELECT id FROM empresas LIMIT 100`);
    if (empresas.length === 0) {
      return { value: 0, level: 'CRITICO', trend: 'ESTAVEL', criteria: [] };
    }

    const scores = await Promise.all(
      empresas.map((e: any) => this.calculateScore(e.id).catch(() => null)),
    );

    const validScores = scores.filter((s): s is NonNullable<typeof s> => s !== null);
    if (validScores.length === 0) {
      return { overall: 0, level: 'CRITICO' as any, trend: 'ESTAVEL' as any, breakdown: [] } as any;
    }

    const avgValue = Math.round(validScores.reduce((sum, s) => sum + (s.overall ?? 0), 0) / validScores.length);
    const level = avgValue >= 80 ? 'EXCELENTE' : avgValue >= 60 ? 'BOM' : avgValue >= 40 ? 'ATENCAO' : 'CRITICO';

    return { overall: avgValue, level, trend: 'ESTAVEL' as const, breakdown: validScores[0]?.breakdown ?? [] } as any;
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

  async updateChecklist(
    empresaId: string,
    checklistId: string,
    responses: { itemId: string; answer: string; notes?: string; evidenceIds?: string[] }[],
    actorId: string,
  ) {
    await this.findById(empresaId);

    const checklist = await this.db.queryOne(
      `SELECT * FROM checklists WHERE id = $1 AND aggregate_id = $2`,
      [checklistId, empresaId],
    );
    if (!checklist) throw new NotFoundException(`Checklist ${checklistId} nao encontrado`);

    const totalItems = (checklist as any).items?.length ?? responses.length;
    let conformeCount = 0;
    let naoConformeCount = 0;
    let parcialCount = 0;
    let naCount = 0;

    for (const resp of responses) {
      await this.db.query(
        `INSERT INTO checklist_responses (id, checklist_id, item_id, answer, notes, evidence_ids, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (checklist_id, item_id) DO UPDATE SET answer = $4, notes = $5, evidence_ids = $6, updated_at = NOW()`,
        [ulid(), checklistId, resp.itemId, resp.answer, resp.notes || null, JSON.stringify(resp.evidenceIds ?? [])],
      );

      switch (resp.answer) {
        case 'SIM': conformeCount++; break;
        case 'NAO': naoConformeCount++; break;
        case 'PARCIAL': parcialCount++; break;
        case 'NA': naCount++; break;
      }
    }

    const answered = responses.length;
    const scoreable = answered - naCount;
    const score = scoreable > 0 ? Math.round((conformeCount + parcialCount * 0.5) / scoreable * 100) : 100;

    await this.db.query(
      `UPDATE checklists SET status = $1, updated_at = NOW() WHERE id = $2`,
      [answered >= totalItems ? 'COMPLETED' : 'IN_PROGRESS', checklistId],
    );

    await this.eventStore.append(empresaId, 'empresa', 'CHECKLIST_SUBMITTED', {
      checklistId, answered, totalItems, score,
    }, {
      actorId, actorRole: 'contador', ip: '0.0.0.0', correlationId: ulid(),
    });

    return {
      checklistId,
      totalItems,
      answered,
      conformeCount,
      naoConformeCount,
      parcialCount,
      naCount,
      score,
      completedAt: new Date(),
    };
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

  async getRelatorio(id: string, meses = 12): Promise<Buffer> {
    const empresa = await this.findById(id) as any;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - meses, 1);

    return this.evidenceGenerator.generateDossier(id, 'empresa', { start, end: now }, {
      name: empresa.razao_social,
      identifier: empresa.cnpj,
      regimeTributario: empresa.regime_tributario,
    });
  }
}
