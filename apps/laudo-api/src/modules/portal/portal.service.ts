import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';

@Injectable()
export class PortalService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('PortalService');
  }

  async findByToken(token: string) {
    const portalToken = await this.db.queryOne(
      `SELECT * FROM portal_tokens WHERE id = $1`, [token],
    );
    if (!portalToken) throw new NotFoundException('Link invalido ou inexistente');
    if (new Date(portalToken.expires_at) < new Date()) {
      throw new NotFoundException('Link expirado');
    }

    const laudo = await this.db.queryOne(`SELECT * FROM laudos WHERE id = $1`, [portalToken.laudo_id]);
    if (!laudo) throw new NotFoundException('Laudo nao encontrado');

    const lab = await this.db.queryOne(`SELECT nome, cnpj, endereco FROM laboratorios WHERE id = $1`, [laudo.laboratorio_id]);

    // Parse resultados
    let resultados = [];
    if (laudo.resultados) {
      const raw = typeof laudo.resultados === 'string' ? JSON.parse(laudo.resultados) : laudo.resultados;
      resultados = (raw || []).map((r: any) => ({
        analito: r.analito || r.nome,
        resultado: r.resultado || String(r.valor),
        unidade: r.unidade,
        valorReferencia: r.valorReferencia || `${r.refMin || ''}-${r.refMax || ''}`,
        flag: r.flag || 'normal',
        explicacao: this.gerarExplicacao(r),
      }));
    }

    return {
      id: laudo.id,
      paciente: laudo.paciente_nome || laudo.paciente_id || 'Paciente',
      tipoExame: laudo.tipo_exame,
      dataColeta: laudo.data_coleta || laudo.created_at,
      dataLiberacao: laudo.liberado_at || laudo.updated_at,
      bioquimicoResponsavel: laudo.assinado_por || laudo.bioquimico_responsavel || 'Bioquimico',
      resultados,
      resumo: this.gerarResumo(resultados),
      laboratorio: lab || { nome: '', cnpj: '', endereco: '' },
    };
  }

  private gerarExplicacao(r: any): string {
    const flag = r.flag || 'normal';
    const analito = r.analito || r.nome || 'Este analito';
    if (flag === 'critico') return `${analito} esta em nivel critico e precisa de atencao medica imediata.`;
    if (flag === 'alto') return `${analito} esta acima dos valores de referencia.`;
    if (flag === 'baixo') return `${analito} esta abaixo dos valores de referencia.`;
    return `${analito} esta dentro dos valores normais.`;
  }

  private gerarResumo(resultados: any[]): string {
    const criticos = resultados.filter(r => r.flag === 'critico').length;
    const alterados = resultados.filter(r => r.flag === 'alto' || r.flag === 'baixo').length;
    const normais = resultados.filter(r => r.flag === 'normal').length;

    if (criticos > 0) return `Atencao: ${criticos} resultado(s) em nivel critico requerem acompanhamento medico imediato.`;
    if (alterados > 0) return `${alterados} resultado(s) fora dos valores de referencia. Consulte seu medico para orientacao.`;
    if (normais === resultados.length && resultados.length > 0) return 'Todos os resultados estao dentro dos valores normais.';
    return '';
  }
}
