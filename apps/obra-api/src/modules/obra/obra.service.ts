import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import {
  EventStoreService,
  ScoreEngineService,
  AlertEngineService,
  VektusAdapterService,
  EvidenceGeneratorService,
  DatabaseService,
  ComplianceLogger,
} from '@compliancecore/sdk';
import { OBRA_CRITERIA, OBRA_DOC_CATEGORIES } from '../../config/obra.config';
import { CreateObraDto, UpdateObraDto, UploadNotaFiscalDto, SubmitChecklistDto } from './obra.dto';
import { CriarObraUseCase } from './use-cases/criar-obra.use-case';
import { RegistrarNotaFiscalUseCase } from './use-cases/registrar-nota-fiscal.use-case';

@Injectable()
export class ObraService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly scoreEngine: ScoreEngineService,
    private readonly alertEngine: AlertEngineService,
    private readonly vektus: VektusAdapterService,
    private readonly evidenceGenerator: EvidenceGeneratorService,
    private readonly logger: ComplianceLogger,
    private readonly criarObraUseCase: CriarObraUseCase,
    private readonly registrarNFUseCase: RegistrarNotaFiscalUseCase,
  ) {
    this.logger.setContext('ObraService');
  }

  async create(dto: CreateObraDto, actorId: string) {
    return this.criarObraUseCase.execute(dto, actorId);
  }

  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows, countResult] = await Promise.all([
      this.db.query(
        `SELECT o.*,
          (SELECT e.nome FROM etapas e WHERE e.obra_id = o.id AND e.status = 'em_andamento' ORDER BY e.ordem ASC LIMIT 1) as etapa_atual,
          (SELECT COUNT(*)::int FROM etapas e2 WHERE e2.obra_id = o.id AND e2.status = 'concluida') as etapas_concluidas,
          (SELECT COUNT(*)::int FROM etapas e3 WHERE e3.obra_id = o.id) as etapas_total
         FROM obras o
         ORDER BY o.created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      this.db.queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM obras`),
    ]);

    // Compute progresso from etapas
    const data = rows.map((r: any) => ({
      ...r,
      progresso: r.etapas_total > 0
        ? Math.round((r.etapas_concluidas / r.etapas_total) * 100)
        : (r.progresso ?? 0),
    }));

    const total = parseInt(countResult?.count ?? '0', 10);
    return { data, total, page, limit, hasMore: offset + rows.length < total };
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
    await this.db.query(`UPDATE obras SET status = 'CANCELADA', updated_at = NOW() WHERE id = $1`, [id]);

    await this.eventStore.append(id, 'obra', 'OBRA_CANCELLED', {}, {
      actorId, actorRole: 'construtor', ip: '0.0.0.0', correlationId: ulid(),
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

  async uploadDocument(id: string, file: any, actorId: string) {
    await this.findById(id);
    const docId = ulid();

    const ingestResult = await this.vektus.ingest(file.content || file.fileKey || '', {
      fileName: file.fileName || file.nome,
      vertical: 'obra',
      category: file.category || file.categoria,
      tags: ['obra', id],
    });

    await this.db.query(
      `INSERT INTO documents (id, aggregate_id, aggregate_type, vertical, file_name, file_key, file_size, mime_type, category, vektus_file_id, version, uploaded_by, expires_at, created_at, updated_at)
       VALUES ($1, $2, 'obra', 'obra', $3, $4, $5, $6, $7, $8, 1, $9, $10, NOW(), NOW())`,
      [docId, id, file.fileName || file.nome, file.fileKey || `obra/${id}/${docId}`, file.fileSize || 0, file.mimeType || 'application/octet-stream', file.category || file.categoria, ingestResult.fileId, actorId, file.dataValidade || file.expiresAt || null],
    );

    // Register alert for documents with expiry
    if (file.dataValidade || file.expiresAt) {
      await this.alertEngine.register({
        entityId: id,
        entityType: 'obra',
        vertical: 'obra',
        alertType: 'DOC_EXPIRY',
        dueDate: new Date(file.dataValidade || file.expiresAt),
        daysBeforeAlert: [30, 15, 7, 1],
        channels: ['in_app', 'email'],
        metadata: { docId, category: file.category || file.categoria, fileName: file.fileName || file.nome },
      });
    }

    await this.eventStore.append(id, 'obra', 'DOCUMENT_UPLOADED', { docId, category: file.category || file.categoria }, {
      actorId, actorRole: 'construtor', ip: '0.0.0.0', correlationId: ulid(),
    });

    return { docId, vektusFileId: ingestResult.fileId };
  }

  async getAlerts(id: string) {
    await this.findById(id);
    return this.alertEngine.getUpcoming(id, 90);
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

  async getScoreHistory(id: string, months: number = 6) {
    await this.findById(id);
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    return this.scoreEngine.getHistory(id, { start, end });
  }

  async uploadNota(id: string, dto: UploadNotaFiscalDto, actorId: string) {
    return this.registrarNFUseCase.execute(id, dto, actorId);
  }

  async getNotas(id: string) {
    await this.findById(id);
    return this.db.query(
      `SELECT * FROM notas_fiscais WHERE obra_id = $1 ORDER BY created_at DESC`,
      [id],
    );
  }

  async submitEtapaChecklist(obraId: string, etapaId: string, dto: SubmitChecklistDto, actorId: string) {
    await this.findById(obraId);
    const checklistId = ulid();

    // Store checklist submission
    await this.db.query(
      `INSERT INTO checklist_submissions (id, obra_id, etapa_id, responses, submitted_by, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [checklistId, obraId, etapaId, JSON.stringify(dto.responses), actorId],
    );

    // Calculate score from responses
    const total = dto.responses.length;
    const conforme = dto.responses.filter(r => r.answer === 'SIM').length;
    const parcial = dto.responses.filter(r => r.answer === 'PARCIAL').length;
    const score = total > 0 ? Math.round(((conforme + parcial * 0.5) / total) * 100) : 0;

    await this.eventStore.append(obraId, 'obra', 'CHECKLIST_SUBMETIDO', {
      checklistId, etapaId, score, totalItems: total, conformeCount: conforme,
    }, { actorId, actorRole: 'construtor', ip: '0.0.0.0', correlationId: ulid() });

    return { checklistId, score, totalItems: total, conformeCount: conforme };
  }

  async getMateriais(id: string) {
    await this.findById(id);
    return this.db.query(
      `SELECT m.*, nf.fornecedor as nf_fornecedor, nf.valor_total as nf_valor
       FROM materiais m
       LEFT JOIN notas_fiscais nf ON m.nota_fiscal_id = nf.id
       WHERE m.obra_id = $1 AND (m.status IS NULL OR m.status != 'CANCELADO')
       ORDER BY m.created_at DESC`,
      [id],
    );
  }

  async getRelatorio(id: string) {
    const obra = await this.findById(id);
    const [score, documents, etapas, fotos, notas] = await Promise.all([
      this.calculateScore(id).catch(() => null),
      this.getDocuments(id),
      this.db.query(`SELECT * FROM etapas WHERE obra_id = $1 ORDER BY ordem ASC`, [id]),
      this.db.query(`SELECT * FROM fotos_obra WHERE obra_id = $1 ORDER BY created_at DESC`, [id]),
      this.getNotas(id),
    ]);

    // Financial summary
    const orcamentoTotal = parseFloat(obra.orcamento_total || '0');
    const gastoAtual = parseFloat(obra.gasto_atual || '0');
    const percentGasto = orcamentoTotal > 0 ? Math.round((gastoAtual / orcamentoTotal) * 100) : 0;

    return {
      obra,
      financeiro: { orcamentoTotal, gastoAtual, percentGasto, saldo: orcamentoTotal - gastoAtual },
      compliance: score,
      documents,
      etapas,
      fotos: fotos.slice(0, 20), // Last 20 photos
      notasFiscais: notas,
      generatedAt: new Date(),
    };
  }
}
