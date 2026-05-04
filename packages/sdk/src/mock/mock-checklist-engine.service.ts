import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import type {
  Checklist,
  ChecklistItem,
  ChecklistResponse,
  ChecklistResult,
} from '@compliancecore/shared';

@Injectable()
export class MockChecklistEngineService {
  private checklists: Checklist[] = [];
  private results: ChecklistResult[] = [];
  private vertical = process.env.VERTICAL ?? 'mock';

  async generate(
    aggregateId: string,
    entityType: string,
    _context?: string,
  ): Promise<Checklist> {
    const items: ChecklistItem[] = [
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

    const checklist: Checklist = {
      id: ulid(),
      aggregateId,
      entityType,
      vertical: this.vertical,
      items,
      status: 'PENDING',
      createdAt: new Date(),
    };

    this.checklists.push(checklist);
    return checklist;
  }

  async evaluate(
    checklistId: string,
    responses: ChecklistResponse[],
  ): Promise<ChecklistResult> {
    const checklist = this.checklists.find(c => c.id === checklistId);
    if (!checklist) throw new Error(`Checklist not found: ${checklistId}`);

    const items = checklist.items;
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
        case 'SIM': conformeCount++; break;
        case 'NAO': naoConformeCount++; break;
        case 'PARCIAL': parcialCount++; break;
        case 'NA': naCount++; break;
      }
    }

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

    checklist.status = answered >= items.length ? 'COMPLETED' : 'IN_PROGRESS';
    this.results.push(result);

    return result;
  }
}
