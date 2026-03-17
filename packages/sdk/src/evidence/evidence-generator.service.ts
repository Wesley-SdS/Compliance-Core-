import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { DatabaseService } from '../shared/database.js';
import { ComplianceCoreConfigService } from '../shared/config.js';
import { ComplianceLogger } from '../shared/logger.js';
import type {
  ComplianceEvent,
  ComplianceScore,
  Document as ComplianceDocument,
  ChecklistResult,
  TimelineEvent,
  TimelineData,
  DateRange,
} from '@compliancecore/shared';

@Injectable()
export class EvidenceGeneratorService {
  constructor(
    private readonly db: DatabaseService,
    private readonly config: ComplianceCoreConfigService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('EvidenceGeneratorService');
  }

  async generateDossier(
    entityId: string,
    entityType: string,
    range: DateRange,
    entityInfo?: { name: string; identifier: string; [key: string]: unknown },
  ): Promise<Buffer> {
    this.logger.log(`Generating dossier for ${entityType}/${entityId}`, {
      from: range.start.toISOString(),
      to: range.end.toISOString(),
    });

    const [events, scores, documents, checklists] = await Promise.all([
      this.getEventsForEntity(entityId, range),
      this.getScoresForEntity(entityId, range),
      this.getDocumentsForEntity(entityId),
      this.getChecklistsForEntity(entityId, range),
    ]);

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Cover page
      this.renderCoverPage(doc, entityId, entityType, range, entityInfo);

      // Score history section
      if (scores.length > 0) {
        doc.addPage();
        this.renderScoreHistory(doc, scores);
      }

      // Document inventory
      if (documents.length > 0) {
        doc.addPage();
        this.renderDocumentInventory(doc, documents);
      }

      // Event timeline
      if (events.length > 0) {
        doc.addPage();
        this.renderEventTimeline(doc, events);
      }

      // Checklist results
      if (checklists.length > 0) {
        doc.addPage();
        this.renderChecklistResults(doc, checklists);
      }

      doc.end();
    });
  }

  async generateTimeline(entityId: string, range: DateRange): Promise<TimelineData> {
    const events = await this.getEventsForEntity(entityId, range);

    const timelineEvents: TimelineEvent[] = events.map(event => ({
      id: event.id,
      type: event.eventType,
      title: this.formatEventTitle(event.eventType),
      description: this.formatEventDescription(event),
      timestamp: event.createdAt,
      actor: event.metadata?.actorId ?? 'system',
      metadata: event.payload,
    }));

    return {
      events: timelineEvents,
      entityId,
      period: { start: range.start, end: range.end },
    };
  }

  private renderCoverPage(
    doc: PDFKit.PDFDocument,
    entityId: string,
    entityType: string,
    range: DateRange,
    entityInfo?: { name: string; identifier: string; [key: string]: unknown },
  ): void {
    doc.fontSize(28).text('Dossiê de Compliance', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(14);
    doc.text(`Vertical: ${this.config.vertical.toUpperCase()}`, { align: 'center' });
    doc.moveDown();

    if (entityInfo) {
      doc.text(`Entidade: ${entityInfo.name}`, { align: 'center' });
      doc.text(`Identificador: ${entityInfo.identifier}`, { align: 'center' });
    } else {
      doc.text(`Entidade: ${entityType}/${entityId}`, { align: 'center' });
    }

    doc.moveDown();
    doc.text(`Período: ${range.start.toLocaleDateString('pt-BR')} a ${range.end.toLocaleDateString('pt-BR')}`, { align: 'center' });
    doc.moveDown();
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });

    doc.moveDown(4);
    doc.fontSize(10).text(
      'Este documento foi gerado automaticamente pelo ComplianceCore SDK e contém informações confidenciais.',
      { align: 'center' },
    );
  }

  private renderScoreHistory(doc: PDFKit.PDFDocument, scores: ComplianceScore[]): void {
    doc.fontSize(20).text('Histórico de Score de Compliance');
    doc.moveDown();

    doc.fontSize(10);
    const headerY = doc.y;
    doc.text('Data', 50, headerY, { width: 120 });
    doc.text('Score', 170, headerY, { width: 60 });
    doc.text('Nível', 230, headerY, { width: 80 });
    doc.text('Tendência', 310, headerY, { width: 80 });
    doc.text('Barra', 390, headerY, { width: 150 });
    doc.moveDown();

    doc.moveTo(50, doc.y).lineTo(540, doc.y).stroke();
    doc.moveDown(0.5);

    for (const score of scores) {
      if (doc.y > 700) {
        doc.addPage();
      }

      const y = doc.y;
      const dateStr = new Date(score.calculatedAt).toLocaleDateString('pt-BR');
      doc.text(dateStr, 50, y, { width: 120 });
      doc.text(score.overall.toFixed(1), 170, y, { width: 60 });
      doc.text(score.level, 230, y, { width: 80 });
      doc.text(score.trend, 310, y, { width: 80 });

      // Text-based bar chart
      const barLength = Math.round(score.overall / 100 * 20);
      const bar = '\u2588'.repeat(barLength) + '\u2591'.repeat(20 - barLength);
      doc.text(bar, 390, y, { width: 150 });
      doc.moveDown();
    }

    // Summary
    doc.moveDown();
    const overalls = scores.map(s => s.overall);
    const avg = (overalls.reduce((a, b) => a + b, 0) / overalls.length).toFixed(1);
    const min = Math.min(...overalls).toFixed(1);
    const max = Math.max(...overalls).toFixed(1);

    doc.fontSize(12).text(`Resumo: Média=${avg} | Mín=${min} | Máx=${max} | Total de avaliações: ${scores.length}`);
  }

  private renderDocumentInventory(doc: PDFKit.PDFDocument, documents: ComplianceDocument[]): void {
    doc.fontSize(20).text('Inventário de Documentos');
    doc.moveDown();

    doc.fontSize(10);
    for (const document of documents) {
      if (doc.y > 700) {
        doc.addPage();
      }

      doc.font('Helvetica-Bold').text(document.fileName);
      doc.font('Helvetica');
      doc.text(`  Categoria: ${document.category}`);
      doc.text(`  Versão: ${document.version}`);
      doc.text(`  Enviado por: ${document.uploadedBy} em ${new Date(document.createdAt).toLocaleDateString('pt-BR')}`);

      if (document.expiresAt) {
        const expiryDate = new Date(document.expiresAt);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const expiryStatus = daysUntilExpiry < 0 ? 'EXPIRADO' : daysUntilExpiry < 30 ? 'EXPIRANDO' : 'VÁLIDO';
        doc.text(`  Validade: ${expiryDate.toLocaleDateString('pt-BR')} (${expiryStatus})`);
      }

      doc.text(`  Vektus: ${document.vektusFileId ? 'Indexado' : 'Não indexado'}`);
      doc.moveDown(0.5);
    }
  }

  private renderEventTimeline(doc: PDFKit.PDFDocument, events: ComplianceEvent[]): void {
    doc.fontSize(20).text('Timeline de Eventos');
    doc.moveDown();

    doc.fontSize(10);
    for (const event of events) {
      if (doc.y > 700) {
        doc.addPage();
      }

      const dateStr = new Date(event.createdAt).toLocaleString('pt-BR');
      doc.font('Helvetica-Bold').text(`[${dateStr}] ${this.formatEventTitle(event.eventType)}`);
      doc.font('Helvetica');
      doc.text(`  Tipo: ${event.eventType} | Ator: ${event.metadata?.actorId ?? 'system'}`);

      const description = this.formatEventDescription(event);
      if (description) {
        doc.text(`  ${description}`);
      }

      doc.moveDown(0.5);
    }
  }

  private renderChecklistResults(doc: PDFKit.PDFDocument, checklists: ChecklistResult[]): void {
    doc.fontSize(20).text('Resultados de Checklists');
    doc.moveDown();

    doc.fontSize(10);
    for (const checklist of checklists) {
      if (doc.y > 700) {
        doc.addPage();
      }

      doc.font('Helvetica-Bold').text(`Checklist: ${checklist.checklistId}`);
      doc.font('Helvetica');
      doc.text(`  Score: ${checklist.score.toFixed(1)}%`);
      doc.text(`  Total: ${checklist.totalItems} itens | Respondidos: ${checklist.answered}`);
      doc.text(`  Conforme: ${checklist.conformeCount} | Não conforme: ${checklist.naoConformeCount} | Parcial: ${checklist.parcialCount} | N/A: ${checklist.naCount}`);
      doc.text(`  Concluído em: ${new Date(checklist.completedAt).toLocaleDateString('pt-BR')}`);
      doc.moveDown(0.5);
    }
  }

  private async getEventsForEntity(entityId: string, range: DateRange): Promise<ComplianceEvent[]> {
    return this.db.query<ComplianceEvent>(
      `SELECT id, aggregate_id AS "aggregateId", aggregate_type AS "aggregateType",
              event_type AS "eventType", event_version AS "eventVersion",
              payload, metadata, vertical, created_at AS "createdAt"
       FROM compliance_events
       WHERE aggregate_id = $1 AND created_at >= $2 AND created_at <= $3
       ORDER BY created_at ASC`,
      [entityId, range.start, range.end],
    );
  }

  private async getScoresForEntity(entityId: string, range: DateRange): Promise<ComplianceScore[]> {
    return this.db.query<ComplianceScore>(
      `SELECT id, aggregate_id AS "aggregateId", overall, level, breakdown, trend,
              calculated_at AS "calculatedAt"
       FROM compliance_scores
       WHERE aggregate_id = $1 AND calculated_at >= $2 AND calculated_at <= $3
       ORDER BY calculated_at ASC`,
      [entityId, range.start, range.end],
    );
  }

  private async getDocumentsForEntity(entityId: string): Promise<ComplianceDocument[]> {
    return this.db.query<ComplianceDocument>(
      `SELECT id, aggregate_id AS "aggregateId", aggregate_type AS "aggregateType",
              vertical, file_name AS "fileName", file_key AS "fileKey",
              file_size AS "fileSize", mime_type AS "mimeType", category,
              expires_at AS "expiresAt", vektus_file_id AS "vektusFileId",
              version, uploaded_by AS "uploadedBy",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM compliance_documents
       WHERE aggregate_id = $1
       ORDER BY created_at DESC`,
      [entityId],
    );
  }

  private async getChecklistsForEntity(entityId: string, range: DateRange): Promise<ChecklistResult[]> {
    return this.db.query<ChecklistResult>(
      `SELECT checklist_id AS "checklistId", total_items AS "totalItems",
              answered, conforme_count AS "conformeCount",
              nao_conforme_count AS "naoConformeCount",
              parcial_count AS "parcialCount", na_count AS "naCount",
              score, completed_at AS "completedAt"
       FROM checklist_results
       WHERE checklist_id IN (
         SELECT id FROM compliance_checklists WHERE aggregate_id = $1
       )
       AND completed_at >= $2 AND completed_at <= $3
       ORDER BY completed_at DESC`,
      [entityId, range.start, range.end],
    );
  }

  private formatEventTitle(eventType: string): string {
    return eventType
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  private formatEventDescription(event: ComplianceEvent): string {
    const payload = event.payload;
    if (!payload) return '';

    const parts: string[] = [];
    if (payload.description) parts.push(String(payload.description));
    if (payload.reason) parts.push(`Motivo: ${payload.reason}`);
    if (payload.status) parts.push(`Status: ${payload.status}`);
    return parts.join(' | ');
  }
}
