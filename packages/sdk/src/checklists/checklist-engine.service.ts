import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { DatabaseService } from '../shared/database.js';
import { ComplianceCoreConfigService } from '../shared/config.js';
import { ComplianceLogger } from '../shared/logger.js';
import { VektusAdapterService } from '../vektus/vektus-adapter.service.js';
import type {
  Checklist,
  ChecklistItem,
  ChecklistResponse,
  ChecklistResult,
} from '@compliancecore/shared';

@Injectable()
export class ChecklistEngineService {
  constructor(
    private readonly db: DatabaseService,
    private readonly config: ComplianceCoreConfigService,
    private readonly logger: ComplianceLogger,
    private readonly vektus: VektusAdapterService,
  ) {
    this.logger.setContext('ChecklistEngineService');
  }

  async generate(
    aggregateId: string,
    entityType: string,
    context?: string,
  ): Promise<Checklist> {
    const vertical = this.config.vertical;

    // Search Vektus for requirements applicable to this entity type
    const searchQuery = `Requisitos de compliance para ${entityType} no setor ${vertical}${context ? ': ' + context : ''}`;
    const searchResults = await this.vektus.search(searchQuery, {
      filters: { vertical },
      topK: 20,
    });

    // Build checklist items from search results
    const items: ChecklistItem[] = [];
    const seenQuestions = new Set<string>();

    for (const result of searchResults) {
      const extractedItems = this.extractChecklistItems(result.content, result.metadata);

      for (const item of extractedItems) {
        const normalizedQuestion = item.question.toLowerCase().trim();
        if (!seenQuestions.has(normalizedQuestion)) {
          seenQuestions.add(normalizedQuestion);
          items.push({
            id: ulid(),
            question: item.question,
            category: item.category,
            required: item.required,
            helpText: item.helpText,
            regulationRef: item.regulationRef,
          });
        }
      }
    }

    // If no items found from Vektus, generate default compliance items
    if (items.length === 0) {
      items.push(...this.getDefaultItems(entityType, vertical));
    }

    const checklistId = ulid();
    const checklist: Checklist = {
      id: checklistId,
      aggregateId,
      entityType,
      vertical,
      items,
      status: 'PENDING',
      createdAt: new Date(),
    };

    // Persist checklist
    await this.db.query(
      `INSERT INTO compliance_checklists (id, aggregate_id, entity_type, vertical, items, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        checklist.id,
        checklist.aggregateId,
        checklist.entityType,
        checklist.vertical,
        JSON.stringify(checklist.items),
        checklist.status,
        checklist.createdAt,
      ],
    );

    this.logger.log(`Checklist generated with ${items.length} items for ${entityType}/${aggregateId}`, {
      checklistId,
    });

    return checklist;
  }

  async evaluate(
    checklistId: string,
    responses: ChecklistResponse[],
  ): Promise<ChecklistResult> {
    // Load the checklist
    const checklist = await this.db.queryOne<Checklist>(
      `SELECT id, aggregate_id AS "aggregateId", entity_type AS "entityType",
              vertical, items, status, created_at AS "createdAt"
       FROM compliance_checklists
       WHERE id = $1`,
      [checklistId],
    );

    if (!checklist) {
      throw new Error(`Checklist not found: ${checklistId}`);
    }

    const items: ChecklistItem[] = typeof checklist.items === 'string'
      ? JSON.parse(checklist.items as unknown as string)
      : checklist.items;

    const responseMap = new Map(responses.map(r => [r.itemId, r]));

    let conformeCount = 0;
    let naoConformeCount = 0;
    let parcialCount = 0;
    let naCount = 0;
    let answered = 0;

    for (const item of items) {
      const response = responseMap.get(item.id);
      if (!response) continue;

      answered++;
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

    // Calculate conformity score: (conforme + 0.5*parcial) / (total - NA) * 100
    const applicableItems = answered - naCount;
    const score = applicableItems > 0
      ? Math.round(((conformeCount + parcialCount * 0.5) / applicableItems) * 10000) / 100
      : 100;

    const result: ChecklistResult = {
      checklistId,
      totalItems: items.length,
      answered,
      conformeCount,
      naoConformeCount,
      parcialCount,
      naCount,
      score,
      completedAt: new Date(),
    };

    // Persist result, responses, and status update atomically
    const newStatus = answered >= items.length ? 'COMPLETED' : 'IN_PROGRESS';

    await this.db.transaction(async (query) => {
      await query(
        `INSERT INTO checklist_results
           (checklist_id, total_items, answered, conforme_count, nao_conforme_count,
            parcial_count, na_count, score, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          result.checklistId,
          result.totalItems,
          result.answered,
          result.conformeCount,
          result.naoConformeCount,
          result.parcialCount,
          result.naCount,
          result.score,
          result.completedAt,
        ],
      );

      // Save individual responses
      for (const response of responses) {
        await query(
          `INSERT INTO checklist_responses (id, checklist_id, item_id, answer, notes, evidence_ids, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            ulid(),
            checklistId,
            response.itemId,
            response.answer,
            response.notes ?? null,
            JSON.stringify(response.evidenceIds ?? []),
          ],
        );
      }

      // Update checklist status
      await query(
        `UPDATE compliance_checklists SET status = $1 WHERE id = $2`,
        [newStatus, checklistId],
      );
    });

    this.logger.log(`Checklist evaluated: ${checklistId}, score: ${score}%`, {
      checklistId,
      score,
      answered,
      totalItems: items.length,
    });

    return result;
  }

  private extractChecklistItems(
    content: string,
    metadata: Record<string, unknown>,
  ): Array<{
    question: string;
    category: string;
    required: boolean;
    helpText?: string;
    regulationRef?: string;
  }> {
    const items: Array<{
      question: string;
      category: string;
      required: boolean;
      helpText?: string;
      regulationRef?: string;
    }> = [];

    // Extract questions/requirements from content chunks
    const lines = content.split('\n').filter(l => l.trim().length > 0);

    for (const line of lines) {
      const trimmed = line.trim();

      // Match lines that look like requirements or questions
      if (
        trimmed.endsWith('?') ||
        /^(deve|obrigatório|necessário|requer|exige)/i.test(trimmed) ||
        /^\d+[\.\)]\s+/.test(trimmed)
      ) {
        const cleaned = trimmed.replace(/^\d+[\.\)]\s+/, '').replace(/^[-*]\s+/, '');
        if (cleaned.length > 10 && cleaned.length < 500) {
          const isRequired = /obrigatório|deve|exige|necessário/i.test(cleaned);
          const category = (metadata.category as string) || 'Geral';
          const regulationRef = (metadata.regulationRef as string) || undefined;

          items.push({
            question: cleaned.endsWith('?') ? cleaned : `${cleaned}?`,
            category,
            required: isRequired,
            helpText: regulationRef ? `Ref: ${regulationRef}` : undefined,
            regulationRef,
          });
        }
      }
    }

    return items;
  }

  private getDefaultItems(entityType: string, vertical: string): ChecklistItem[] {
    const defaults: ChecklistItem[] = [
      {
        id: ulid(),
        question: 'A entidade possui todos os alvarás e licenças de funcionamento válidos?',
        category: 'Licenciamento',
        required: true,
        helpText: 'Verificar validade de todos os documentos de funcionamento',
      },
      {
        id: ulid(),
        question: 'O cadastro da entidade está atualizado junto aos órgãos reguladores?',
        category: 'Cadastro',
        required: true,
        helpText: 'Confirmar atualização cadastral',
      },
      {
        id: ulid(),
        question: 'Existem pendências fiscais ou tributárias?',
        category: 'Tributário',
        required: true,
        helpText: 'Consultar certidões negativas de débito',
      },
      {
        id: ulid(),
        question: 'Os profissionais responsáveis possuem habilitação válida?',
        category: 'Habilitação',
        required: true,
        helpText: 'Verificar registros profissionais e habilitações',
      },
      {
        id: ulid(),
        question: 'Os processos internos estão documentados e atualizados?',
        category: 'Processos',
        required: false,
        helpText: 'Avaliar procedimentos operacionais padrão',
      },
      {
        id: ulid(),
        question: 'Existe um plano de contingência para não-conformidades?',
        category: 'Gestão de Riscos',
        required: false,
        helpText: 'Verificar planos de ação para situações de não-conformidade',
      },
    ];

    return defaults;
  }
}
