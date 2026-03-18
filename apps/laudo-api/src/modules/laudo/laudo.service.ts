import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService } from '@compliancecore/sdk/event-store/event-store.service';
import { VektusAdapterService } from '@compliancecore/sdk/vektus/vektus-adapter.service';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';
import { AuthUser } from '@compliancecore/sdk';

import { CreateLaudoDto, UpdateLaudoDto } from './laudo.dto';
export { CreateLaudoDto, UpdateLaudoDto };

@Injectable()
export class LaudoService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly vektus: VektusAdapterService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('LaudoService');
  }

  async create(dto: CreateLaudoDto, actorId: string) {
    const id = ulid();

    await this.db.query(
      `INSERT INTO laudos (id, laboratorio_id, paciente_id, tipo_exame, material_biologico,
        metodologia, resultado, unidade, valor_referencia, observacoes, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'RASCUNHO', NOW(), NOW())`,
      [id, dto.laboratorioId, dto.pacienteId || null, dto.tipoExame, dto.materialBiologico,
        dto.metodologia, dto.resultado || null, dto.unidade || null,
        dto.valorReferencia || null, dto.observacoes || null],
    );

    await this.eventStore.append(dto.laboratorioId, 'laboratorio', 'LAUDO_CREATED', { laudoId: id, tipoExame: dto.tipoExame }, {
      actorId, actorRole: 'biomedico', ip: '0.0.0.0', correlationId: ulid(),
    });

    this.logger.log(`Laudo created: ${id}`, { laudoId: id });
    return this.findById(id);
  }

  async findByLaboratorio(laboratorioId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows, countResult] = await Promise.all([
      this.db.query(
        `SELECT * FROM laudos WHERE laboratorio_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [laboratorioId, limit, offset],
      ),
      this.db.queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM laudos WHERE laboratorio_id = $1`, [laboratorioId],
      ),
    ]);
    const total = parseInt(countResult?.count ?? '0', 10);
    return { data: rows, total, page, limit, hasMore: offset + rows.length < total };
  }

  async findById(id: string) {
    const laudo = await this.db.queryOne(`SELECT * FROM laudos WHERE id = $1`, [id]);
    if (!laudo) throw new NotFoundException(`Laudo ${id} nao encontrado`);
    return laudo;
  }

  async update(id: string, dto: UpdateLaudoDto, actorId: string) {
    const laudo = await this.findById(id);
    const changes: Array<{campo:string;valorAnterior:any;valorNovo:any}> = [];

    // Diff field by field
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        const oldVal = laudo[col];
        if (JSON.stringify(oldVal) !== JSON.stringify(value)) {
          changes.push({ campo: col, valorAnterior: oldVal, valorNovo: value });
        }
      }
    }

    // Build SQL update
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
    if (fields.length === 0) return laudo;

    fields.push(`updated_at = $${idx}`); values.push(new Date()); idx++;
    values.push(id);
    await this.db.query(`UPDATE laudos SET ${fields.join(', ')} WHERE id = $${idx}`, values);

    // Event per changed field
    for (const change of changes) {
      await this.eventStore.append(id, 'laudo', 'CAMPO_ALTERADO', {
        campo: change.campo, valorAnterior: change.valorAnterior, valorNovo: change.valorNovo,
      }, { actorId, actorRole: 'biomedico', ip: '0.0.0.0', correlationId: ulid() });
    }

    // Also store aggregate event on lab
    if (changes.length > 0) {
      await this.eventStore.append(laudo.laboratorio_id, 'laboratorio', 'LAUDO_UPDATED', {
        laudoId: id, changedFields: changes.map(c => c.campo),
      }, { actorId, actorRole: 'biomedico', ip: '0.0.0.0', correlationId: ulid() });
    }

    return this.findById(id);
  }

  async delete(id: string, actorId: string) {
    const laudo = await this.findById(id);
    await this.db.query(`DELETE FROM laudos WHERE id = $1`, [id]);

    await this.eventStore.append(laudo.laboratorio_id, 'laboratorio', 'LAUDO_DELETED', { laudoId: id }, {
      actorId, actorRole: 'biomedico', ip: '0.0.0.0', correlationId: ulid(),
    });
  }

  async aiReview(id: string, actorId: string) {
    const laudo = await this.findById(id);
    const reviewContext = `Tipo: ${laudo.tipo_exame}, Material: ${laudo.material_biologico}, Resultado: ${laudo.resultado || ''}, Ref: ${laudo.valor_referencia || ''}`;

    const skillsResult = await this.vektus.injectSkills('L3', reviewContext, {
      vertical: 'laudo',
    });

    const searchResults = await this.vektus.search(
      `${laudo.tipo_exame} ${laudo.resultado || ''} interpretacao valores criticos`,
      { filters: { vertical: 'laudo' }, topK: 8 },
    );

    // Build structured alerts
    const alertas: Array<{id:string;tipo:string;mensagem:string;analito?:string}> = [];
    let resultados: any[] = [];
    try { resultados = laudo.resultados ? (typeof laudo.resultados === 'string' ? JSON.parse(laudo.resultados) : laudo.resultados) : []; } catch { /* */ }

    // Detect critical values and out-of-range locally
    for (const r of resultados) {
      const val = parseFloat(r.resultado || r.valor);
      if (isNaN(val)) continue;
      if (r.limiteCriticoAlto && val > r.limiteCriticoAlto) {
        alertas.push({ id: ulid(), tipo: 'critico', mensagem: `${r.analito || r.nome} ${val} ${r.unidade} — acima do limite critico (>${r.limiteCriticoAlto}). Notificacao medica recomendada.`, analito: r.analito || r.nome });
      }
      if (r.limiteCriticoBaixo && val < r.limiteCriticoBaixo) {
        alertas.push({ id: ulid(), tipo: 'critico', mensagem: `${r.analito || r.nome} ${val} ${r.unidade} — abaixo do limite critico (<${r.limiteCriticoBaixo}). Notificacao medica recomendada.`, analito: r.analito || r.nome });
      }
      if (r.flag === 'alto' || r.flag === 'baixo') {
        alertas.push({ id: ulid(), tipo: 'inconsistencia', mensagem: `${r.analito || r.nome} ${val} ${r.unidade} — fora dos valores de referencia (${r.valorReferencia || ''}).`, analito: r.analito || r.nome });
      }
    }

    // Detect Hb/Ht inconsistency
    const hb = resultados.find((r: any) => (r.analito || r.nome || '').toLowerCase().includes('hemoglobina'));
    const ht = resultados.find((r: any) => (r.analito || r.nome || '').toLowerCase().includes('hematocrit'));
    if (hb && ht) {
      const hbVal = parseFloat(hb.resultado || hb.valor);
      const htVal = parseFloat(ht.resultado || ht.valor);
      if (!isNaN(hbVal) && !isNaN(htVal)) {
        const expected = hbVal * 3;
        if (Math.abs(htVal - expected) > 3) {
          alertas.push({ id: ulid(), tipo: 'inconsistencia', mensagem: `Relacao Hb/Ht inconsistente: Hemoglobina ${hbVal} g/dL esperaria Hematocrito ~${expected.toFixed(0)}%, encontrado ${htVal}%.`, analito: 'Hemoglobina/Hematocrito' });
        }
      }
    }

    // Vektus-based suggestions
    if (searchResults.length > 0) {
      const topRef = searchResults[0];
      alertas.push({ id: ulid(), tipo: 'sugestao', mensagem: `Baseado em guidelines: ${typeof topRef === 'string' ? topRef.substring(0, 200) : (topRef.content || JSON.stringify(topRef)).substring(0, 200)}` });
    }

    // Save review in laudo
    const revisaoData = JSON.stringify({ alertas, reviewedAt: new Date() });
    await this.db.query(`UPDATE laudos SET revisao_ia = $1, status = 'EM_REVISAO', updated_at = NOW() WHERE id = $2`, [revisaoData, id]);

    await this.eventStore.append(laudo.laboratorio_id, 'laboratorio', 'LAUDO_AI_REVIEWED', {
      laudoId: id, alertasCount: alertas.length, criticosCount: alertas.filter(a => a.tipo === 'critico').length,
    }, { actorId, actorRole: 'biomedico', ip: '0.0.0.0', correlationId: ulid() });

    return { laudoId: id, alertas, reviewedAt: new Date() };
  }

  async getHistorico(id: string) {
    await this.findById(id);
    return this.eventStore.getAuditTrail({ aggregateId: id, aggregateType: 'laudo', page: 1, limit: 100 });
  }

  async liberarLaudo(id: string, user: AuthUser) {
    const laudo = await this.findById(id);
    if (laudo.status === 'LIBERADO') throw new Error('Laudo ja liberado');

    const role = (user as any).role || 'biomedico';
    if (!['bioquimico', 'admin', 'biomedico'].includes(role)) {
      throw new Error('Somente bioquimico habilitado pode liberar laudos');
    }

    const token = ulid();
    await this.db.query(
      `UPDATE laudos SET status='LIBERADO', laudo_assinado=true, assinado_por=$1, crbio_responsavel=$2, liberado_at=NOW(), updated_at=NOW() WHERE id=$3`,
      [user.name || user.id, (user as any).crbio || '', id],
    );

    // Create portal token (7 day expiry)
    await this.db.query(
      `INSERT INTO portal_tokens (id, laudo_id, created_at, expires_at) VALUES ($1, $2, NOW(), NOW() + INTERVAL '7 days')`,
      [token, id],
    );

    await this.eventStore.append(id, 'laudo', 'LAUDO_LIBERADO', {
      assinadoPor: user.name || user.id, crbio: (user as any).crbio || '',
    }, { actorId: user.id, actorRole: role, ip: '0.0.0.0', correlationId: ulid() });

    await this.eventStore.append(laudo.laboratorio_id, 'laboratorio', 'LAUDO_LIBERADO', {
      laudoId: id, portalToken: token,
    }, { actorId: user.id, actorRole: role, ip: '0.0.0.0', correlationId: ulid() });

    return { ...await this.findById(id), portalToken: token };
  }

  async generatePdf(id: string, res: any) {
    const laudo = await this.findById(id);
    let lab: any = {};
    try { lab = await this.db.queryOne(`SELECT * FROM laboratorios WHERE id=$1`, [laudo.laboratorio_id]); } catch { /* */ }

    let resultados: any[] = [];
    try { resultados = laudo.resultados ? (typeof laudo.resultados === 'string' ? JSON.parse(laudo.resultados) : laudo.resultados) : []; } catch { /* */ }

    const lines = [
      lab?.nome || 'Laboratorio',
      `CNPJ: ${lab?.cnpj || ''} | CRBio: ${lab?.crbm || ''}`,
      '',
      `LAUDO DE EXAME - ${laudo.tipo_exame}`,
      `Paciente: ${laudo.paciente_id || 'N/A'}`,
      `Material: ${laudo.material_biologico}`,
      `Metodologia: ${laudo.metodologia}`,
      `Data: ${laudo.created_at}`,
      '',
      'RESULTADOS:',
      ...resultados.map((r: any) => `  ${r.analito || r.nome}: ${r.resultado || r.valor} ${r.unidade} (Ref: ${r.valorReferencia || `${r.refMin||''}-${r.refMax||''}`})`),
      '',
      laudo.observacoes ? `Observacoes: ${laudo.observacoes}` : '',
      '',
      laudo.laudo_assinado ? `Assinado por: ${laudo.assinado_por}` : 'Laudo nao liberado',
      laudo.liberado_at ? `Liberado em: ${laudo.liberado_at}` : '',
      '',
      `Rastreabilidade: ${id}`,
    ].filter(Boolean);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="laudo-${id}.txt"`);
    res.send(lines.join('\n'));
  }

  async aiReviewAction(id: string, dto: { alertaId: string; acao: string; analito?: string }, actorId: string) {
    const laudo = await this.findById(id);
    const eventType = dto.acao === 'aceitar' ? 'AI_ALERTA_ACEITO' : 'AI_ALERTA_IGNORADO';
    await this.eventStore.append(id, 'laudo', eventType, {
      alertaId: dto.alertaId, analito: dto.analito, acao: dto.acao,
    }, { actorId, actorRole: 'biomedico', ip: '0.0.0.0', correlationId: ulid() });
    return { success: true };
  }
}
