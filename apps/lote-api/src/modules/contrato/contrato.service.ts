import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService, DatabaseService, ComplianceLogger } from '@compliancecore/sdk';

import { CreateContratoDto, UpdateContratoDto, RegistrarPagamentoDto, GerarBoletoDto } from './contrato.dto';
export { CreateContratoDto, UpdateContratoDto, RegistrarPagamentoDto, GerarBoletoDto };

@Injectable()
export class ContratoService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('ContratoService');
  }

  async create(dto: CreateContratoDto, actorId: string) {
    const id = ulid();
    const valorFinanciado = dto.valorTotal - dto.valorEntrada;
    const taxaMensal = dto.taxaJurosMensal / 100;

    await this.db.query(
      `INSERT INTO contratos (id, loteamento_id, lote_id, comprador_id, valor_total, valor_entrada,
        valor_financiado, numero_parcelas, taxa_juros_mensal, sistema, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ATIVO', NOW(), NOW())`,
      [id, dto.loteamentoId, dto.loteId, dto.compradorId, dto.valorTotal, dto.valorEntrada,
        valorFinanciado, dto.numeroParcelas, dto.taxaJurosMensal, dto.sistema],
    );

    // Generate parcelas
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
        const parcelaId = ulid();
        const vencimento = new Date();
        vencimento.setMonth(vencimento.getMonth() + i);

        await this.db.query(
          `INSERT INTO parcelas (id, contrato_id, numero, valor_amortizacao, valor_juros, valor_prestacao,
            saldo_devedor, data_vencimento, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDENTE', NOW(), NOW())`,
          [parcelaId, id, i,
            Math.round(amortizacao * 100) / 100,
            Math.round(juros * 100) / 100,
            Math.round(prestacaoFixa * 100) / 100,
            Math.max(0, Math.round(saldo * 100) / 100),
            vencimento],
        );
      }
    } else {
      const amortizacaoFixa = valorFinanciado / dto.numeroParcelas;
      let saldo = valorFinanciado;

      for (let i = 1; i <= dto.numeroParcelas; i++) {
        const juros = saldo * taxaMensal;
        const prestacao = amortizacaoFixa + juros;
        saldo -= amortizacaoFixa;
        const parcelaId = ulid();
        const vencimento = new Date();
        vencimento.setMonth(vencimento.getMonth() + i);

        await this.db.query(
          `INSERT INTO parcelas (id, contrato_id, numero, valor_amortizacao, valor_juros, valor_prestacao,
            saldo_devedor, data_vencimento, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDENTE', NOW(), NOW())`,
          [parcelaId, id, i,
            Math.round(amortizacaoFixa * 100) / 100,
            Math.round(juros * 100) / 100,
            Math.round(prestacao * 100) / 100,
            Math.max(0, Math.round(saldo * 100) / 100),
            vencimento],
        );
      }
    }

    // Set lote status to VENDIDO and link comprador
    await this.db.query(
      `UPDATE lotes SET status = 'VENDIDO', comprador_id = $1, updated_at = NOW() WHERE id = $2`,
      [dto.compradorId, dto.loteId],
    );

    await this.eventStore.append(dto.loteamentoId, 'loteamento', 'CONTRATO_CREATED', {
      contratoId: id, loteId: dto.loteId, compradorId: dto.compradorId, valorTotal: dto.valorTotal,
    }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }

  async findAll(loteamentoId: string) {
    return this.db.query(
      `SELECT c.*, comp.nome as comprador_nome, l.quadra, l.numero as lote_numero
       FROM contratos c
       LEFT JOIN compradores comp ON comp.id = c.comprador_id
       LEFT JOIN lotes l ON l.id = c.lote_id
       WHERE c.loteamento_id = $1
       ORDER BY c.created_at DESC`,
      [loteamentoId],
    );
  }

  async findById(id: string) {
    const contrato = await this.db.queryOne(
      `SELECT c.*, comp.nome as comprador_nome, l.quadra, l.numero as lote_numero
       FROM contratos c
       LEFT JOIN compradores comp ON comp.id = c.comprador_id
       LEFT JOIN lotes l ON l.id = c.lote_id
       WHERE c.id = $1`,
      [id],
    );
    if (!contrato) throw new NotFoundException(`Contrato ${id} nao encontrado`);

    const parcelas = await this.db.query(
      `SELECT * FROM parcelas WHERE contrato_id = $1 ORDER BY numero`,
      [id],
    );

    return { ...contrato, parcelas };
  }

  async update(id: string, dto: UpdateContratoDto, actorId: string) {
    const contrato = await this.findById(id);
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

    if (fields.length === 0) return contrato;

    fields.push(`updated_at = $${idx}`);
    values.push(new Date());
    idx++;
    values.push(id);

    await this.db.query(`UPDATE contratos SET ${fields.join(', ')} WHERE id = $${idx}`, values);

    await this.eventStore.append(contrato.loteamento_id, 'loteamento', 'CONTRATO_UPDATED', { contratoId: id, changes: dto }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }

  async registrarPagamento(id: string, dto: RegistrarPagamentoDto, actorId: string) {
    const contrato = await this.findById(id);

    const parcela = await this.db.queryOne(
      `SELECT * FROM parcelas WHERE contrato_id = $1 AND numero = $2`,
      [id, dto.parcelaNumero],
    );
    if (!parcela) throw new NotFoundException(`Parcela ${dto.parcelaNumero} nao encontrada`);
    if (parcela.status === 'PAGO') throw new BadRequestException(`Parcela ${dto.parcelaNumero} ja esta paga`);

    await this.db.query(
      `UPDATE parcelas SET status = 'PAGO', valor_pago = $1, data_pagamento = $2, updated_at = NOW()
       WHERE contrato_id = $3 AND numero = $4`,
      [dto.valorPago, dto.dataPagamento, id, dto.parcelaNumero],
    );

    // Check if all parcelas are paid → QUITADO
    const pendentes = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM parcelas WHERE contrato_id = $1 AND status != 'PAGO'`,
      [id],
    );
    const countPendentes = parseInt(pendentes?.count ?? '0', 10);

    if (countPendentes === 0) {
      await this.db.query(
        `UPDATE contratos SET status = 'QUITADO', updated_at = NOW() WHERE id = $1`,
        [id],
      );
    }

    await this.eventStore.append(contrato.loteamento_id, 'loteamento', 'PAGAMENTO_REGISTRADO', {
      contratoId: id, parcelaNumero: dto.parcelaNumero, valorPago: dto.valorPago,
      quitado: countPendentes === 0,
    }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }

  async distratar(id: string, actorId: string) {
    const contrato = await this.findById(id);
    if (contrato.status === 'DISTRATADO') throw new BadRequestException('Contrato ja distratado');

    // Calcular valores pagos (parcelas + entrada)
    const pagosResult = await this.db.queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(valor_pago), 0) as total FROM parcelas WHERE contrato_id = $1 AND status = 'PAGO'`,
      [id],
    );
    const totalPagoParcelas = parseFloat(pagosResult?.total ?? '0');
    const totalPago = totalPagoParcelas + (contrato.valor_entrada ?? 0);

    // Lei 13.786/2018 Art. 32-A: multa de até 25% do valor pago
    const percentualMulta = 0.25;
    const multa = Math.round(totalPago * percentualMulta * 100) / 100;
    const valorDevolver = Math.round((totalPago - multa) * 100) / 100;

    await this.db.query(
      `UPDATE contratos SET status = 'DISTRATADO', distratado_at = NOW(), multa_distrato = $1, valor_devolver = $2, updated_at = NOW() WHERE id = $3`,
      [multa, valorDevolver, id],
    );

    // Liberar lote
    await this.db.query(
      `UPDATE lotes SET status = 'DISPONIVEL', comprador_id = NULL, updated_at = NOW() WHERE id = $1`,
      [contrato.lote_id],
    );

    await this.eventStore.append(contrato.loteamento_id, 'loteamento', 'CONTRATO_DISTRATADO', {
      contratoId: id, loteId: contrato.lote_id,
      totalPago, multa, valorDevolver, percentualMulta,
      fundamentacao: 'Lei 13.786/2018 Art. 32-A',
    }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return { ...await this.findById(id), multa, valorDevolver, fundamentacao: 'Lei 13.786/2018 — Multa de 25% sobre valor pago' };
  }

  async getParcelas(id: string) {
    const contrato = await this.db.queryOne(`SELECT id FROM contratos WHERE id = $1`, [id]);
    if (!contrato) throw new NotFoundException(`Contrato ${id} nao encontrado`);

    return this.db.query(
      `SELECT * FROM parcelas WHERE contrato_id = $1 ORDER BY numero`,
      [id],
    );
  }

  async gerarBoleto(id: string, dto: GerarBoletoDto, actorId: string) {
    const contrato = await this.findById(id);

    const parcela = await this.db.queryOne(
      `SELECT * FROM parcelas WHERE contrato_id = $1 AND numero = $2`,
      [id, dto.parcelaNumero],
    );
    if (!parcela) throw new NotFoundException(`Parcela ${dto.parcelaNumero} nao encontrada`);

    const boletoCode = `${id}-${dto.parcelaNumero}-${ulid()}`;

    await this.eventStore.append(contrato.loteamento_id, 'loteamento', 'BOLETO_GERADO', {
      contratoId: id, parcelaNumero: dto.parcelaNumero, boletoCode,
    }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return {
      contratoId: id,
      parcelaNumero: dto.parcelaNumero,
      valor: parcela.valor_prestacao,
      vencimento: parcela.data_vencimento,
      codigoBarras: boletoCode,
      linhaDigitavel: boletoCode.replace(/-/g, '.'),
      linkPagamento: `https://lotepro.pay/boleto/${boletoCode}`,
    };
  }
}
