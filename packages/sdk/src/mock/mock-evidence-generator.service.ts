import { Injectable } from '@nestjs/common';
import type {
  TimelineEvent,
  TimelineData,
  DateRange,
} from '@compliancecore/shared';

@Injectable()
export class MockEvidenceGeneratorService {
  async generateDossier(
    entityId: string,
    entityType: string,
    range: DateRange,
    entityInfo?: { name: string; identifier: string; [key: string]: unknown },
  ): Promise<Buffer> {
    // Generate a simple text-based dossier instead of PDF
    const name = entityInfo?.name ?? `${entityType}/${entityId}`;
    const content = [
      '=== DOSSIÊ DE COMPLIANCE (MOCK) ===',
      '',
      `Entidade: ${name}`,
      `Tipo: ${entityType}`,
      `ID: ${entityId}`,
      `Período: ${range.start.toISOString()} a ${range.end.toISOString()}`,
      `Gerado em: ${new Date().toISOString()}`,
      '',
      '--- Score de Compliance ---',
      'Score atual: 85.0 (BOM)',
      'Tendência: ESTÁVEL',
      '',
      '--- Documentos ---',
      'Nenhum documento registrado no período (modo mock).',
      '',
      '--- Eventos ---',
      'Nenhum evento registrado no período (modo mock).',
      '',
      '=== FIM DO DOSSIÊ ===',
    ].join('\n');

    return Buffer.from(content, 'utf-8');
  }

  async generateTimeline(entityId: string, range: DateRange): Promise<TimelineData> {
    const events: TimelineEvent[] = [];
    return {
      events,
      entityId,
      period: { start: range.start, end: range.end },
    };
  }
}
