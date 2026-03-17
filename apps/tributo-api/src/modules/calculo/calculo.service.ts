import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService } from '@compliancecore/sdk/event-store/event-store.service';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';

import { SimularCalculoDto } from './calculo.dto';
import { CalculoEngine } from './calculo-engine';

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
  private readonly engine = new CalculoEngine();

  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('CalculoService');
  }

  async simular(dto: SimularCalculoDto, actorId: string): Promise<ResultadoCalculo> {
    const id = ulid();

    // Buscar regime da empresa para comparativo
    const empresa = await this.db.queryOne<any>(
      `SELECT regime_tributario FROM empresas WHERE id = $1`, [dto.empresaId],
    );

    // Extrair ano da competência para aplicar fator de transição
    const ano = dto.competencia ? parseInt(dto.competencia.substring(0, 4), 10) : 2033;

    const calc = this.engine.calcularSimples({
      faturamentoBruto: dto.faturamentoBruto,
      tipoOperacao: dto.tipoOperacao,
      aliquotaCbs: dto.aliquotaCbs,
      aliquotaIbs: dto.aliquotaIbs,
      aliquotaIs: dto.aliquotaIs,
      creditosPis: dto.creditosPis,
      creditosCofins: dto.creditosCofins,
      regimeTributario: empresa?.regime_tributario,
      ano,
    });

    const resultado: ResultadoCalculo = {
      id,
      empresaId: dto.empresaId,
      faturamentoBruto: dto.faturamentoBruto,
      cbs: calc.cbs,
      ibs: calc.ibs,
      is: calc.is,
      totalTributos: calc.totalTributos,
      cargaTributariaEfetiva: calc.cargaTributariaEfetiva,
      creditosAproveitados: calc.creditosAproveitados,
      valorLiquido: calc.valorLiquido,
      competencia: dto.competencia,
      simuladoEm: new Date(),
    };

    await this.db.transaction(async (query) => {
      await query(
        `INSERT INTO calculos_tributarios (id, empresa_id, faturamento_bruto, cbs, ibs, imposto_seletivo,
          total_tributos, carga_tributaria_efetiva, creditos_aproveitados, valor_liquido, competencia,
          tipo_operacao, descricao, simulado_em)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
        [id, dto.empresaId, dto.faturamentoBruto, resultado.cbs, resultado.ibs, resultado.is,
          resultado.totalTributos, resultado.cargaTributariaEfetiva, resultado.creditosAproveitados,
          resultado.valorLiquido, dto.competencia, dto.tipoOperacao, dto.descricao || null],
      );
    });

    await this.eventStore.append(dto.empresaId, 'empresa', 'CALCULO_SIMULADO', {
      calculoId: id, tipoOperacao: dto.tipoOperacao,
      totalTributos: resultado.totalTributos,
      impostoRegimeAtual: calc.impostoRegimeAtual,
      diferencaRegime: calc.diferencaRegime,
    }, {
      actorId, actorRole: 'contador', ip: '0.0.0.0', correlationId: ulid(),
    });

    this.logger.log(`Calculo simulado: ${id} para empresa ${dto.empresaId}`, { calculoId: id });
    return resultado;
  }

  async projetar(empresaId: string) {
    const empresa = await this.db.queryOne<any>(
      `SELECT * FROM empresas WHERE id = $1`, [empresaId],
    );
    if (!empresa) throw new NotFoundException(`Empresa ${empresaId} nao encontrada`);

    // Buscar último cálculo para usar como base
    const ultimoCalculo = await this.db.queryOne<any>(
      `SELECT * FROM calculos_tributarios WHERE empresa_id = $1 ORDER BY simulado_em DESC LIMIT 1`,
      [empresaId],
    );

    const faturamentoBruto = ultimoCalculo?.faturamento_bruto ?? 100000;
    const tipoOperacao = ultimoCalculo?.tipo_operacao ?? 'VENDA_MERCADORIA';

    return this.engine.projetarSimples({
      faturamentoBruto,
      tipoOperacao,
      regimeTributario: empresa.regime_tributario,
    });
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
