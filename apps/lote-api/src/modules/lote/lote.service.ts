import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService, DatabaseService, ComplianceLogger } from '@compliancecore/sdk';

import { CreateLoteDto, UpdateLoteDto, SimularFinanciamentoDto } from './lote.dto';
export { CreateLoteDto, UpdateLoteDto, SimularFinanciamentoDto };

export interface ParcelaSimulacao {
  numero: number;
  amortizacao: number;
  juros: number;
  prestacao: number;
  saldoDevedor: number;
}

@Injectable()
export class LoteService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('LoteService');
  }

  async create(dto: CreateLoteDto, actorId: string) {
    const id = ulid();

    await this.db.query(
      `INSERT INTO lotes (id, loteamento_id, quadra, numero, area_m2, valor_venda,
        frente, fundo, lado_direito, lado_esquerdo, status, contrato_registrado, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'DISPONIVEL', false, NOW(), NOW())`,
      [id, dto.loteamentoId, dto.quadra, dto.numero, dto.areaM2, dto.valorVenda,
        dto.frente || null, dto.fundo || null, dto.ladoDireito || null, dto.ladoEsquerdo || null],
    );

    await this.eventStore.append(dto.loteamentoId, 'loteamento', 'LOTE_CREATED', { loteId: id, quadra: dto.quadra, numero: dto.numero }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }

  async findByLoteamento(loteamentoId: string) {
    return this.db.query(
      `SELECT * FROM lotes WHERE loteamento_id = $1 ORDER BY quadra, numero`,
      [loteamentoId],
    );
  }

  async findById(id: string) {
    const lote = await this.db.queryOne(`SELECT * FROM lotes WHERE id = $1`, [id]);
    if (!lote) throw new NotFoundException(`Lote ${id} nao encontrado`);
    return lote;
  }

  async update(id: string, dto: UpdateLoteDto, actorId: string) {
    const lote = await this.findById(id);
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

    if (fields.length === 0) return lote;

    fields.push(`updated_at = $${idx}`);
    values.push(new Date());
    idx++;
    values.push(id);

    await this.db.query(`UPDATE lotes SET ${fields.join(', ')} WHERE id = $${idx}`, values);

    await this.eventStore.append(lote.loteamento_id, 'loteamento', 'LOTE_UPDATED', { loteId: id, changes: dto }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }

  async delete(id: string, actorId: string) {
    const lote = await this.findById(id);
    await this.db.query(`DELETE FROM lotes WHERE id = $1`, [id]);

    await this.eventStore.append(lote.loteamento_id, 'loteamento', 'LOTE_DELETED', { loteId: id }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });
  }

  async simularFinanciamento(dto: SimularFinanciamentoDto): Promise<{
    loteId: string;
    sistema: string;
    valorFinanciado: number;
    parcelas: ParcelaSimulacao[];
    totalPago: number;
    totalJuros: number;
  }> {
    const lote = await this.findById(dto.loteId);
    const valorFinanciado = lote.valor_venda - dto.valorEntrada;
    const taxaMensal = dto.taxaJurosMensal / 100;
    const parcelas: ParcelaSimulacao[] = [];

    if (dto.sistema === 'PRICE') {
      const coeficiente = taxaMensal > 0
        ? (taxaMensal * Math.pow(1 + taxaMensal, dto.numeroParcelas)) / (Math.pow(1 + taxaMensal, dto.numeroParcelas) - 1)
        : 1 / dto.numeroParcelas;
      const prestacaoFixa = valorFinanciado * coeficiente;
      let saldo = valorFinanciado;

      for (let i = 1; i <= dto.numeroParcelas; i++) {
        const juros = saldo * taxaMensal;
        const amortizacao = prestacaoFixa - juros;
        saldo -= amortizacao;

        parcelas.push({
          numero: i,
          amortizacao: Math.round(amortizacao * 100) / 100,
          juros: Math.round(juros * 100) / 100,
          prestacao: Math.round(prestacaoFixa * 100) / 100,
          saldoDevedor: Math.max(0, Math.round(saldo * 100) / 100),
        });
      }
    } else {
      const amortizacaoFixa = valorFinanciado / dto.numeroParcelas;
      let saldo = valorFinanciado;

      for (let i = 1; i <= dto.numeroParcelas; i++) {
        const juros = saldo * taxaMensal;
        const prestacao = amortizacaoFixa + juros;
        saldo -= amortizacaoFixa;

        parcelas.push({
          numero: i,
          amortizacao: Math.round(amortizacaoFixa * 100) / 100,
          juros: Math.round(juros * 100) / 100,
          prestacao: Math.round(prestacao * 100) / 100,
          saldoDevedor: Math.max(0, Math.round(saldo * 100) / 100),
        });
      }
    }

    const totalPago = dto.valorEntrada + parcelas.reduce((sum, p) => sum + p.prestacao, 0);
    const totalJuros = parcelas.reduce((sum, p) => sum + p.juros, 0);

    return {
      loteId: dto.loteId,
      sistema: dto.sistema,
      valorFinanciado,
      parcelas,
      totalPago: Math.round(totalPago * 100) / 100,
      totalJuros: Math.round(totalJuros * 100) / 100,
    };
  }

  async getDisponiveis(loteamentoId: string) {
    return this.db.query(
      `SELECT * FROM lotes WHERE loteamento_id = $1 AND status = 'DISPONIVEL' ORDER BY quadra, numero`,
      [loteamentoId],
    );
  }

  async getResumo(loteamentoId: string) {
    const result = await this.db.queryOne<{
      total: string; disponivel: string; reservado: string; vendido: string;
    }>(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'DISPONIVEL') as disponivel,
        COUNT(*) FILTER (WHERE status = 'RESERVADO') as reservado,
        COUNT(*) FILTER (WHERE status = 'VENDIDO') as vendido
       FROM lotes WHERE loteamento_id = $1`,
      [loteamentoId],
    );

    return {
      total: parseInt(result?.total ?? '0', 10),
      disponivel: parseInt(result?.disponivel ?? '0', 10),
      reservado: parseInt(result?.reservado ?? '0', 10),
      vendido: parseInt(result?.vendido ?? '0', 10),
    };
  }
}
