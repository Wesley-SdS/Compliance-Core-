import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import type {
  LegislationSource,
  NewLegislation,
  ImpactReport,
} from '@compliancecore/shared';

@Injectable()
export class MockLegislationMonitorService {
  private sources: LegislationSource[] = [];
  private items: NewLegislation[] = [];
  private vertical = process.env.VERTICAL ?? 'mock';

  async registerSource(source: Omit<LegislationSource, 'id'>): Promise<LegislationSource> {
    const fullSource: LegislationSource = { id: ulid(), ...source };
    this.sources.push(fullSource);
    return fullSource;
  }

  async check(): Promise<NewLegislation[]> {
    // Return empty - no real sources to check in mock mode
    return [];
  }

  async ingestToVektus(_legislation: NewLegislation): Promise<void> {
    // No-op in mock mode
  }

  async analyzeImpact(legislationId: string, entityId: string): Promise<ImpactReport> {
    const legislation = this.items.find(i => i.id === legislationId);

    return {
      legislationId,
      entityId,
      impactLevel: 'BAIXO',
      affectedAreas: ['Geral'],
      requiredActions: ['Monitorar atualizações futuras'],
      deadline: undefined,
      analysis: legislation
        ? `Análise mock de impacto da legislação "${legislation.title}" na entidade ${entityId}.`
        : `Análise mock de impacto para legislação ${legislationId}.`,
    } as ImpactReport;
  }
}
