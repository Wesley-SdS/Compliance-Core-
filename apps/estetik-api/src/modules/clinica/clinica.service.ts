import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ulid } from 'ulid';
import {
  EventStoreService,
  ScoreEngineService,
  AlertEngineService,
  DatabaseService,
} from '@compliancecore/sdk';
import type {
  ComplianceScore,
  PaginatedEvents,
  TimelineData,
  TimelineEvent,
  Document,
  Checklist,
  ChecklistItem,
  ChecklistResult,
  DueAlert,
} from '@compliancecore/shared';
import { ESTETIK_CRITERIA } from '../../config/estetik.config';
import {
  CreateClinicaDto,
  UpdateClinicaDto,
  UploadDocumentDto,
  SubmitChecklistDto,
} from './clinica.dto';

interface ClinicaEntity {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  telefone?: string;
  email?: string;
  responsavelTecnico?: {
    nome: string;
    crm?: string;
    cro?: string;
    especialidade: string;
  };
  equipamentos?: Array<{
    nome: string;
    fabricante: string;
    registroAnvisa?: string;
    ultimaCalibracao?: string;
  }>;
  profissionais?: Array<{
    nome: string;
    funcao: string;
    registro?: string;
    treinamentoValido: boolean;
    ultimoTreinamento?: string;
  }>;
  procedimentos?: Array<{
    id: string;
    nome: string;
    popId?: string;
    popUpdatedAt?: string;
  }>;
  documents?: Array<{
    id: string;
    category: string;
    expiresAt?: string;
  }>;
  pgrss?: {
    implementado: boolean;
    atualizado: boolean;
    ultimaRevisao?: string;
  };
  infraestrutura?: {
    extintorValido: boolean;
    saidaEmergencia: boolean;
    acessibilidade: boolean;
    sinalizacao: boolean;
  };
  lgpdTermVersion?: string;
  lgpdTermAccepted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ClinicaService {
  private readonly logger = new Logger(ClinicaService.name);

  constructor(
    private readonly eventStore: EventStoreService,
    private readonly scoreEngine: ScoreEngineService,
    private readonly alertEngine: AlertEngineService,
    private readonly db: DatabaseService,
  ) {}

  async create(dto: CreateClinicaDto, actorId: string): Promise<ClinicaEntity> {
    const id = ulid();
    const now = new Date();

    const clinica: ClinicaEntity = {
      id,
      nome: dto.nome,
      cnpj: dto.cnpj,
      endereco: dto.endereco,
      telefone: dto.telefone,
      email: dto.email,
      responsavelTecnico: dto.responsavelTecnico,
      equipamentos: dto.equipamentos || [],
      profissionais: dto.profissionais || [],
      procedimentos: [],
      documents: [],
      lgpdTermVersion: dto.lgpdTermVersion,
      lgpdTermAccepted: dto.lgpdTermAccepted,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.query(
      `INSERT INTO clinicas (id, data, created_at, updated_at)
       VALUES ($1, $2, $3, $4)`,
      [id, JSON.stringify(clinica), now, now],
    );

    await this.eventStore.append(id, 'Clinica', 'CLINICA_CREATED', clinica, {
      actorId,
      actorRole: 'admin',
      ip: '0.0.0.0',
      correlationId: ulid(),
    });

    this.logger.log(`Clinica created: ${clinica.nome} (${id})`);
    return clinica;
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: ClinicaEntity[]; total: number; page: number; limit: number; hasMore: boolean }> {
    const offset = (page - 1) * limit;

    const countResult = await this.db.queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM clinicas',
    );
    const total = parseInt(countResult?.count ?? '0', 10);

    const rows = await this.db.query<{ data: ClinicaEntity }>(
      'SELECT data FROM clinicas ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset],
    );

    const data = rows.map((r) => r.data);
    return { data, total, page, limit, hasMore: offset + data.length < total };
  }

  async findOne(id: string): Promise<ClinicaEntity> {
    const row = await this.db.queryOne<{ data: ClinicaEntity }>(
      'SELECT data FROM clinicas WHERE id = $1',
      [id],
    );
    if (!row) {
      throw new NotFoundException(`Clinica ${id} nao encontrada`);
    }
    return row.data;
  }

  async update(id: string, dto: UpdateClinicaDto, actorId: string): Promise<ClinicaEntity> {
    const existing = await this.findOne(id);
    const now = new Date();

    const updated: ClinicaEntity = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(dto).filter(([_, v]) => v !== undefined),
      ),
      updatedAt: now,
    };

    await this.db.query(
      'UPDATE clinicas SET data = $1, updated_at = $2 WHERE id = $3',
      [JSON.stringify(updated), now, id],
    );

    await this.eventStore.append(id, 'Clinica', 'CLINICA_UPDATED', {
      changes: dto,
      updatedAt: now,
    }, {
      actorId,
      actorRole: 'admin',
      ip: '0.0.0.0',
      correlationId: ulid(),
    });

    this.logger.log(`Clinica updated: ${updated.nome} (${id})`);
    return updated;
  }

  async calculateScore(id: string): Promise<ComplianceScore> {
    const clinica = await this.findOne(id);

    const score = await this.scoreEngine.calculate(id, ESTETIK_CRITERIA, clinica);

    await this.eventStore.append(id, 'Clinica', 'SCORE_CALCULATED', {
      scoreId: score.id,
      overall: score.overall,
      level: score.level,
    }, {
      actorId: 'system',
      actorRole: 'system',
      ip: '0.0.0.0',
      correlationId: ulid(),
    });

    return score;
  }

  async getScore(id: string): Promise<ComplianceScore | null> {
    const row = await this.db.queryOne<{
      id: string;
      aggregate_id: string;
      overall: number;
      level: string;
      breakdown: string;
      trend: string;
      calculated_at: Date;
    }>(
      `SELECT id, aggregate_id, overall, level, breakdown, trend, calculated_at
       FROM compliance_scores
       WHERE aggregate_id = $1
       ORDER BY calculated_at DESC LIMIT 1`,
      [id],
    );
    if (!row) return null;
    return {
      id: row.id,
      aggregateId: row.aggregate_id,
      overall: row.overall,
      level: row.level as any,
      breakdown: typeof row.breakdown === 'string' ? JSON.parse(row.breakdown) : row.breakdown,
      trend: row.trend as any,
      calculatedAt: row.calculated_at,
    };
  }

  async getScoreHistory(id: string, months: number = 6): Promise<any> {
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    return this.scoreEngine.getHistory(id, { start, end: new Date() });
  }

  async getEvents(id: string, page: number = 1, limit: number = 20): Promise<PaginatedEvents> {
    return this.eventStore.getAuditTrail({
      aggregateId: id,
      aggregateType: 'Clinica',
      page,
      limit,
    });
  }

  async getDocuments(id: string): Promise<Document[]> {
    await this.findOne(id);
    const rows = await this.db.query<{ data: Document }>(
      `SELECT data FROM documents
       WHERE aggregate_id = $1
       ORDER BY created_at DESC`,
      [id],
    );
    return rows.map((r) => r.data);
  }

  async uploadDocument(
    id: string,
    dto: UploadDocumentDto,
    actorId: string,
  ): Promise<Document> {
    await this.findOne(id);
    const docId = ulid();
    const now = new Date();

    const doc: Document = {
      id: docId,
      aggregateId: id,
      aggregateType: 'Clinica',
      vertical: 'estetik',
      fileName: dto.fileName,
      fileKey: dto.fileKey,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      category: dto.category,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      version: 1,
      uploadedBy: actorId,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.query(
      `INSERT INTO documents (id, aggregate_id, data, created_at)
       VALUES ($1, $2, $3, $4)`,
      [docId, id, JSON.stringify(doc), now],
    );

    // Register expiry alert if document has an expiration date
    if (dto.expiresAt) {
      await this.alertEngine.register({
        entityId: id,
        entityType: 'Clinica',
        vertical: 'estetik',
        alertType: 'DOC_EXPIRY',
        dueDate: new Date(dto.expiresAt),
        daysBeforeAlert: [30, 15, 7, 1],
        channels: ['in_app', 'email'],
        metadata: { documentId: docId, fileName: dto.fileName, category: dto.category },
      });
    }

    await this.eventStore.append(id, 'Clinica', 'DOCUMENT_UPLOADED', {
      documentId: docId,
      fileName: dto.fileName,
      category: dto.category,
    }, {
      actorId,
      actorRole: 'admin',
      ip: '0.0.0.0',
      correlationId: ulid(),
    });

    this.logger.log(`Document uploaded for clinica ${id}: ${dto.fileName}`);
    return doc;
  }

  async getAlerts(id: string): Promise<DueAlert[]> {
    await this.findOne(id);
    return this.alertEngine.getUpcoming(id, 90);
  }

  async getChecklist(id: string): Promise<Checklist> {
    await this.findOne(id);

    const existing = await this.db.queryOne<{ data: Checklist }>(
      `SELECT data FROM checklists
       WHERE aggregate_id = $1 AND status != 'COMPLETED'
       ORDER BY created_at DESC LIMIT 1`,
      [id],
    );

    if (existing) {
      return existing.data;
    }

    const checklistId = ulid();
    const items: ChecklistItem[] = [
      {
        id: ulid(),
        question: 'O alvara de funcionamento esta vigente e exposto em local visivel?',
        category: 'Licencas',
        required: true,
        helpText: 'Verificar data de validade e local de exposicao',
        regulationRef: 'RDC 56/2009',
      },
      {
        id: ulid(),
        question: 'A licenca sanitaria da Vigilancia esta atualizada?',
        category: 'Licencas',
        required: true,
        regulationRef: 'Lei 6437/1977',
      },
      {
        id: ulid(),
        question: 'Todos os equipamentos possuem registro Anvisa valido?',
        category: 'Equipamentos',
        required: true,
        helpText: 'Conferir cada equipamento individualmente',
        regulationRef: 'RDC 185/2001',
      },
      {
        id: ulid(),
        question: 'Os equipamentos estao com calibracao em dia?',
        category: 'Equipamentos',
        required: true,
      },
      {
        id: ulid(),
        question: 'Existem POPs atualizados para todos os procedimentos?',
        category: 'Procedimentos',
        required: true,
        regulationRef: 'RDC 36/2008',
      },
      {
        id: ulid(),
        question: 'Os profissionais possuem registro profissional valido?',
        category: 'Profissionais',
        required: true,
      },
      {
        id: ulid(),
        question: 'Os treinamentos da equipe estao em dia?',
        category: 'Profissionais',
        required: true,
      },
      {
        id: ulid(),
        question: 'Os termos de consentimento LGPD estao implementados?',
        category: 'LGPD',
        required: true,
        regulationRef: 'Lei 13.709/2018',
      },
      {
        id: ulid(),
        question: 'Existe controle de descarte de residuos?',
        category: 'Meio Ambiente',
        required: false,
        regulationRef: 'RDC 306/2004',
      },
      {
        id: ulid(),
        question: 'O PGRSS esta implementado e atualizado?',
        category: 'Meio Ambiente',
        required: true,
        helpText: 'Plano de Gerenciamento de Residuos de Servicos de Saude',
        regulationRef: 'RDC 222/2018',
      },
      {
        id: ulid(),
        question: 'Os extintores estao com carga valida e acessiveis?',
        category: 'Infraestrutura',
        required: true,
      },
      {
        id: ulid(),
        question: 'A sinalizacao de emergencia esta adequada?',
        category: 'Infraestrutura',
        required: true,
      },
    ];

    const checklist: Checklist = {
      id: checklistId,
      aggregateId: id,
      entityType: 'Clinica',
      vertical: 'estetik',
      items,
      status: 'PENDING',
      createdAt: new Date(),
    };

    await this.db.query(
      `INSERT INTO checklists (id, aggregate_id, data, created_at)
       VALUES ($1, $2, $3, $4)`,
      [checklistId, id, JSON.stringify(checklist), checklist.createdAt],
    );

    return checklist;
  }

  async submitChecklist(
    id: string,
    dto: SubmitChecklistDto,
    actorId: string,
  ): Promise<ChecklistResult> {
    const checklist = await this.getChecklist(id);

    const totalItems = checklist.items.length;
    const answered = dto.responses.length;
    let conformeCount = 0;
    let naoConformeCount = 0;
    let parcialCount = 0;
    let naCount = 0;

    for (const response of dto.responses) {
      switch (response.answer) {
        case 'SIM':
          conformeCount++;
          break;
        case 'NAO':
          naoConformeCount++;
          break;
        case 'PARCIAL':
          parcialCount++;
          break;
        case 'NA':
          naCount++;
          break;
      }
    }

    const applicableItems = totalItems - naCount;
    const score =
      applicableItems > 0
        ? Math.round(
            ((conformeCount + parcialCount * 0.5) / applicableItems) * 100,
          )
        : 100;

    const result: ChecklistResult = {
      checklistId: checklist.id,
      totalItems,
      answered,
      conformeCount,
      naoConformeCount,
      parcialCount,
      naCount,
      score,
      completedAt: new Date(),
    };

    const updatedChecklist = { ...checklist, status: 'COMPLETED' as const };
    await this.db.query(
      'UPDATE checklists SET data = $1 WHERE id = $2',
      [JSON.stringify(updatedChecklist), checklist.id],
    );

    await this.eventStore.append(id, 'Clinica', 'CHECKLIST_SUBMITTED', {
      checklistId: checklist.id,
      score,
      conformeCount,
      naoConformeCount,
    }, {
      actorId,
      actorRole: 'admin',
      ip: '0.0.0.0',
      correlationId: ulid(),
    });

    return result;
  }

  async generateDossier(id: string, actorId: string): Promise<{ dossierId: string; status: string }> {
    const clinica = await this.findOne(id);
    const score = await this.getScore(id);
    const documents = await this.getDocuments(id);
    const dossierId = ulid();

    const dossierData = {
      id: dossierId,
      clinicaId: id,
      clinicaNome: clinica.nome,
      clinicaCnpj: clinica.cnpj,
      score: score?.overall ?? 0,
      level: score?.level ?? 'CRITICO',
      breakdown: score?.breakdown ?? [],
      documentsCount: documents.length,
      generatedAt: new Date(),
      generatedBy: actorId,
    };

    await this.db.query(
      `INSERT INTO dossiers (id, aggregate_id, data, created_at)
       VALUES ($1, $2, $3, $4)`,
      [dossierId, id, JSON.stringify(dossierData), new Date()],
    );

    await this.eventStore.append(id, 'Clinica', 'DOSSIER_GENERATED', {
      dossierId,
      documentsIncluded: documents.length,
    }, {
      actorId,
      actorRole: 'admin',
      ip: '0.0.0.0',
      correlationId: ulid(),
    });

    this.logger.log(`Dossier generated for clinica ${id}: ${dossierId}`);
    return { dossierId, status: 'generated' };
  }

  async getTimeline(id: string): Promise<TimelineData> {
    await this.findOne(id);

    const events = await this.eventStore.getEvents(id);
    const timelineEvents: TimelineEvent[] = events.map((event) => ({
      id: event.id,
      type: event.eventType,
      title: this.getEventTitle(event.eventType),
      description: this.getEventDescription(event.eventType, event.payload),
      timestamp: event.createdAt,
      actor: event.metadata.actorId,
      metadata: event.payload,
    }));

    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    return {
      events: timelineEvents,
      entityId: id,
      period: { start: sixMonthsAgo, end: now },
    };
  }

  private getEventTitle(eventType: string): string {
    const titles: Record<string, string> = {
      CLINICA_CREATED: 'Clinica cadastrada',
      CLINICA_UPDATED: 'Dados atualizados',
      SCORE_CALCULATED: 'Score recalculado',
      DOCUMENT_UPLOADED: 'Documento enviado',
      CHECKLIST_SUBMITTED: 'Checklist preenchido',
      DOSSIER_GENERATED: 'Dossie gerado',
      ALERT_REGISTERED: 'Alerta registrado',
    };
    return titles[eventType] ?? eventType;
  }

  private getEventDescription(
    eventType: string,
    payload: Record<string, unknown>,
  ): string {
    switch (eventType) {
      case 'CLINICA_CREATED':
        return `Clinica "${payload.nome}" foi cadastrada no sistema`;
      case 'CLINICA_UPDATED':
        return `Dados da clinica foram atualizados`;
      case 'SCORE_CALCULATED':
        return `Score de compliance: ${payload.overall}% (${payload.level})`;
      case 'DOCUMENT_UPLOADED':
        return `Documento "${payload.fileName}" (${payload.category}) enviado`;
      case 'CHECKLIST_SUBMITTED':
        return `Checklist finalizado com score ${payload.score}%`;
      case 'DOSSIER_GENERATED':
        return `Dossie de auditoria gerado (${payload.documentsIncluded} documentos)`;
      default:
        return `Evento: ${eventType}`;
    }
  }
}
