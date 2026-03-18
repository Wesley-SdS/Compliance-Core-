import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService } from '@compliancecore/sdk/event-store/event-store.service';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';

@Injectable()
export class AlertaService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('AlertaService');
  }

  async acknowledge(id: string, actorId: string) {
    const alerta = await this.db.queryOne(`SELECT * FROM alerts WHERE id = $1`, [id]);
    if (!alerta) throw new NotFoundException(`Alerta ${id} nao encontrado`);

    await this.db.query(
      `UPDATE alerts SET status = 'ACKNOWLEDGED', updated_at = NOW() WHERE id = $1`,
      [id],
    );

    await this.eventStore.append(id, 'alerta', 'ALERTA_ACKNOWLEDGED', { alertaId: id }, {
      actorId, actorRole: 'gestor_frota', ip: '0.0.0.0', correlationId: ulid(),
    });

    this.logger.log(`Alerta acknowledged: ${id}`, { alertaId: id });
    return { id, status: 'ACKNOWLEDGED' };
  }

  async getDocumentosVencimentos() {
    return this.db.query(
      `SELECT d.*, v.placa as veiculo_placa, m.nome as motorista_nome
       FROM documents d
       LEFT JOIN veiculos v ON v.id = d.aggregate_id AND d.aggregate_type = 'veiculo'
       LEFT JOIN motoristas m ON m.id = d.aggregate_id AND d.aggregate_type = 'motorista'
       WHERE d.aggregate_type IN ('veiculo', 'motorista')
         AND d.created_at <= NOW() + INTERVAL '30 days'
       ORDER BY d.created_at ASC`,
    );
  }
}
