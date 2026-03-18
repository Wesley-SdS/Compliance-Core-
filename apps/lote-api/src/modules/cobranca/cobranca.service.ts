import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService } from '@compliancecore/sdk/event-store/event-store.service';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';

import { UpdateReguaDto, ExecutarEtapaDto } from './cobranca.dto';
export { UpdateReguaDto, ExecutarEtapaDto };

@Injectable()
export class CobrancaService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('CobrancaService');
  }

  async getRegua() {
    const regua = await this.db.queryOne(
      `SELECT * FROM cobranca_regua ORDER BY updated_at DESC LIMIT 1`,
    );

    if (!regua) {
      return {
        etapas: [
          { dias: -5, canal: 'email', template: 'Lembrete: sua parcela vence em 5 dias.' },
          { dias: 0, canal: 'sms', template: 'Sua parcela vence hoje.' },
          { dias: 5, canal: 'whatsapp', template: 'Sua parcela esta vencida ha 5 dias.' },
          { dias: 15, canal: 'email', template: 'Aviso: parcela vencida ha 15 dias. Regularize.' },
          { dias: 30, canal: 'carta', template: 'Notificacao extrajudicial: parcela vencida ha 30 dias.' },
        ],
      };
    }

    return { id: regua.id, etapas: JSON.parse(regua.etapas), updatedAt: regua.updated_at };
  }

  async updateRegua(dto: UpdateReguaDto, actorId: string) {
    const existing = await this.db.queryOne(
      `SELECT * FROM cobranca_regua ORDER BY updated_at DESC LIMIT 1`,
    );

    if (existing) {
      await this.db.query(
        `UPDATE cobranca_regua SET etapas = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(dto.etapas), existing.id],
      );
    } else {
      const id = ulid();
      await this.db.query(
        `INSERT INTO cobranca_regua (id, etapas, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())`,
        [id, JSON.stringify(dto.etapas)],
      );
    }

    await this.eventStore.append('global', 'cobranca', 'REGUA_UPDATED', {
      etapasCount: dto.etapas.length,
    }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.getRegua();
  }

  async getDashboard() {
    const vencidosResult = await this.db.queryOne<{
      vencidos_30: string; vencidos_60: string; vencidos_90: string; vencidos_total: string;
    }>(
      `SELECT
        COUNT(*) FILTER (WHERE p.data_vencimento >= NOW() - INTERVAL '30 days') as vencidos_30,
        COUNT(*) FILTER (WHERE p.data_vencimento >= NOW() - INTERVAL '60 days' AND p.data_vencimento < NOW() - INTERVAL '30 days') as vencidos_60,
        COUNT(*) FILTER (WHERE p.data_vencimento < NOW() - INTERVAL '60 days') as vencidos_90,
        COUNT(*) as vencidos_total
       FROM parcelas p
       JOIN contratos c ON c.id = p.contrato_id
       WHERE p.status = 'ATRASADO' AND c.status != 'DISTRATADO'`,
    );

    const inadimplenciaResult = await this.db.queryOne<{ total: string; atrasados: string }>(
      `SELECT
        COUNT(DISTINCT c.id) as total,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'INADIMPLENTE') as atrasados
       FROM contratos c WHERE c.status != 'DISTRATADO'`,
    );

    const total = parseInt(inadimplenciaResult?.total ?? '0', 10);
    const atrasados = parseInt(inadimplenciaResult?.atrasados ?? '0', 10);

    return {
      boletosVencidos: {
        ate30dias: parseInt(vencidosResult?.vencidos_30 ?? '0', 10),
        de30a60dias: parseInt(vencidosResult?.vencidos_60 ?? '0', 10),
        acima60dias: parseInt(vencidosResult?.vencidos_90 ?? '0', 10),
        total: parseInt(vencidosResult?.vencidos_total ?? '0', 10),
      },
      inadimplenciaPct: total > 0 ? Math.round((atrasados / total) * 10000) / 100 : 0,
      acoesPendentes: parseInt(vencidosResult?.vencidos_total ?? '0', 10),
    };
  }

  async executarEtapa(dto: ExecutarEtapaDto, actorId: string) {
    const contrato = await this.db.queryOne(
      `SELECT * FROM contratos WHERE id = $1`,
      [dto.contratoId],
    );
    if (!contrato) throw new NotFoundException(`Contrato ${dto.contratoId} nao encontrado`);

    const regua = await this.getRegua();
    const etapa = regua.etapas[dto.etapaIndex];
    if (!etapa) throw new NotFoundException(`Etapa ${dto.etapaIndex} nao encontrada na regua`);

    const execucaoId = ulid();

    await this.db.query(
      `INSERT INTO cobranca_execucoes (id, contrato_id, etapa_index, canal, template, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'ENVIADO', NOW())`,
      [execucaoId, dto.contratoId, dto.etapaIndex, etapa.canal, etapa.template],
    );

    await this.eventStore.append(contrato.loteamento_id, 'loteamento', 'COBRANCA_ETAPA_EXECUTADA', {
      contratoId: dto.contratoId, etapaIndex: dto.etapaIndex, canal: etapa.canal,
    }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return {
      execucaoId,
      contratoId: dto.contratoId,
      etapa,
      status: 'ENVIADO',
    };
  }
}
