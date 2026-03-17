import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService } from '@compliancecore/sdk/event-store/event-store.service';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';

import { SimularCalculoDto } from './calculo.dto';
export { SimularCalculoDto };

export interface ResultadoCalculo {
  id: string;
  empresaId: string;
  faturamentoBruto: number;
  cbs: number;
  ibs: number;
  is: number;
  totalTributos: number;
  cargaTributariaEfetiva: number;
  creditosAproveitados: number;
  valorLiquido: number;
  competencia: string;
  simuladoEm: Date;
}

@Injectable()
export class CalculoService {
  private readonly CBS_ALIQUOTA_PADRAO = 0.088;
  private readonly IBS_ALIQUOTA_PADRAO = 0.175;

  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('CalculoService');
  }

  async simular(dto: SimularCalculoDto, actorId: string): Promise<ResultadoCalculo> {
    const id = ulid();
    const aliquotaCbs = dto.aliquotaCbs ?? this.CBS_ALIQUOTA_PADRAO;
    const aliquotaIbs = dto.aliquotaIbs ?? this.IBS_ALIQUOTA_PADRAO;
    const aliquotaIs = dto.aliquotaIs ?? 0;

    const cbs = dto.faturamentoBruto * aliquotaCbs;
    const ibs = dto.faturamentoBruto * aliquotaIbs;
    const is = dto.faturamentoBruto * aliquotaIs;
    const creditosTotal = (dto.creditosPis ?? 0) + (dto.creditosCofins ?? 0);
    const totalTributos = Math.max(0, cbs + ibs + is - creditosTotal);
    const cargaTributariaEfetiva = dto.faturamentoBruto > 0
      ? (totalTributos / dto.faturamentoBruto) * 100
      : 0;
    const valorLiquido = dto.faturamentoBruto - totalTributos;

    const resultado: ResultadoCalculo = {
      id,
      empresaId: dto.empresaId,
      faturamentoBruto: dto.faturamentoBruto,
      cbs: Math.round(cbs * 100) / 100,
      ibs: Math.round(ibs * 100) / 100,
      is: Math.round(is * 100) / 100,
      totalTributos: Math.round(totalTributos * 100) / 100,
      cargaTributariaEfetiva: Math.round(cargaTributariaEfetiva * 100) / 100,
      creditosAproveitados: Math.round(creditosTotal * 100) / 100,
      valorLiquido: Math.round(valorLiquido * 100) / 100,
      competencia: dto.competencia,
      simuladoEm: new Date(),
    };

    await this.db.query(
      `INSERT INTO calculos_tributarios (id, empresa_id, faturamento_bruto, cbs, ibs, imposto_seletivo,
        total_tributos, carga_tributaria_efetiva, creditos_aproveitados, valor_liquido, competencia,
        tipo_operacao, descricao, simulado_em)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
      [id, dto.empresaId, dto.faturamentoBruto, resultado.cbs, resultado.ibs, resultado.is,
        resultado.totalTributos, resultado.cargaTributariaEfetiva, resultado.creditosAproveitados,
        resultado.valorLiquido, dto.competencia, dto.tipoOperacao, dto.descricao || null],
    );

    await this.eventStore.append(dto.empresaId, 'empresa', 'CALCULO_SIMULADO', {
      calculoId: id, tipoOperacao: dto.tipoOperacao, totalTributos: resultado.totalTributos,
    }, {
      actorId, actorRole: 'contador', ip: '0.0.0.0', correlationId: ulid(),
    });

    this.logger.log(`Calculo simulado: ${id} para empresa ${dto.empresaId}`, { calculoId: id });
    return resultado;
  }

  async getHistorico(empresaId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows, countResult] = await Promise.all([
      this.db.query(
        `SELECT * FROM calculos_tributarios WHERE empresa_id = $1 ORDER BY simulado_em DESC LIMIT $2 OFFSET $3`,
        [empresaId, limit, offset],
      ),
      this.db.queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM calculos_tributarios WHERE empresa_id = $1`,
        [empresaId],
      ),
    ]);
    const total = parseInt(countResult?.count ?? '0', 10);
    return { data: rows, total, page, limit, hasMore: offset + rows.length < total };
  }

  async findById(id: string) {
    const calculo = await this.db.queryOne(`SELECT * FROM calculos_tributarios WHERE id = $1`, [id]);
    if (!calculo) throw new NotFoundException(`Calculo ${id} nao encontrado`);
    return calculo;
  }
}
