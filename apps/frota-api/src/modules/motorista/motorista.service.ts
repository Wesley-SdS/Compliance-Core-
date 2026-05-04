import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService, DatabaseService, ComplianceLogger } from '@compliancecore/sdk';

import { CreateMotoristaDto, UpdateMotoristaDto, RegistrarDescansoDto } from './motorista.dto';
export { CreateMotoristaDto, UpdateMotoristaDto, RegistrarDescansoDto };

@Injectable()
export class MotoristaService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('MotoristaService');
  }

  async create(dto: CreateMotoristaDto, actorId: string) {
    const id = ulid();

    await this.db.query(
      `INSERT INTO motoristas (id, nome, cpf, cnh_numero, cnh_categoria, cnh_validade,
        telefone, transporta_perigoso, mopp_valido, mopp_validade, em_viagem, descanso_conforme,
        status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, true, 'ATIVO', NOW(), NOW())`,
      [id, dto.nome, dto.cpf, dto.cnhNumero, dto.cnhCategoria, dto.cnhValidade,
        dto.telefone || null, dto.transportaPerigoso ?? false,
        dto.moppValido ?? false, dto.moppValidade || null],
    );

    await this.eventStore.append(id, 'motorista', 'MOTORISTA_CREATED', { ...dto }, {
      actorId, actorRole: 'gestor_frota', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }

  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows, countResult] = await Promise.all([
      this.db.query(`SELECT * FROM motoristas ORDER BY nome ASC LIMIT $1 OFFSET $2`, [limit, offset]),
      this.db.queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM motoristas`),
    ]);
    const total = parseInt(countResult?.count ?? '0', 10);
    return { data: rows, total, page, limit, hasMore: offset + rows.length < total };
  }

  async findById(id: string) {
    const motorista = await this.db.queryOne(`SELECT * FROM motoristas WHERE id = $1`, [id]);
    if (!motorista) throw new NotFoundException(`Motorista ${id} nao encontrado`);
    return motorista;
  }

  async update(id: string, dto: UpdateMotoristaDto, actorId: string) {
    await this.findById(id);
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

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = $${idx}`);
    values.push(new Date());
    idx++;
    values.push(id);

    await this.db.query(`UPDATE motoristas SET ${fields.join(', ')} WHERE id = $${idx}`, values);

    await this.eventStore.append(id, 'motorista', 'MOTORISTA_UPDATED', { changes: dto }, {
      actorId, actorRole: 'gestor_frota', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }

  async delete(id: string, actorId: string) {
    await this.findById(id);
    await this.db.query(`DELETE FROM motoristas WHERE id = $1`, [id]);

    await this.eventStore.append(id, 'motorista', 'MOTORISTA_DELETED', {}, {
      actorId, actorRole: 'gestor_frota', ip: '0.0.0.0', correlationId: ulid(),
    });
  }

  async registrarDescanso(dto: RegistrarDescansoDto, actorId: string) {
    const id = ulid();
    await this.findById(dto.motoristaId);

    await this.db.query(
      `INSERT INTO descansos (id, motorista_id, viagem_id, tipo, inicio, fim, local_descanso, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [id, dto.motoristaId, dto.viagemId || null, dto.tipo, dto.inicio, dto.fim || null, dto.localDescanso || null],
    );

    await this.eventStore.append(dto.motoristaId, 'motorista', 'DESCANSO_REGISTRADO', {
      descansoId: id, tipo: dto.tipo, inicio: dto.inicio,
    }, {
      actorId, actorRole: 'gestor_frota', ip: '0.0.0.0', correlationId: ulid(),
    });

    return { id, motoristaId: dto.motoristaId, tipo: dto.tipo };
  }

  async getDescansos(motoristaId: string, page = 1, limit = 20) {
    await this.findById(motoristaId);
    const offset = (page - 1) * limit;
    const [rows, countResult] = await Promise.all([
      this.db.query(
        `SELECT * FROM descansos WHERE motorista_id = $1 ORDER BY inicio DESC LIMIT $2 OFFSET $3`,
        [motoristaId, limit, offset],
      ),
      this.db.queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM descansos WHERE motorista_id = $1`, [motoristaId],
      ),
    ]);
    const total = parseInt(countResult?.count ?? '0', 10);
    return { data: rows, total, page, limit, hasMore: offset + rows.length < total };
  }

  async getCnhVencendo(diasAntecedencia = 30) {
    return this.db.query(
      `SELECT * FROM motoristas WHERE status = 'ATIVO'
       AND cnh_validade <= NOW() + INTERVAL '1 day' * $1
       ORDER BY cnh_validade ASC`,
      [diasAntecedencia],
    );
  }

  /**
   * Calcula horas de conducao conforme Lei 13.103/2015:
   * - Limite continuo: 5.5h sem parada (obrigatorio 30min descanso)
   * - Limite diario (24h): 11h de conducao total
   * - Paradas >= 30min resetam contador continuo
   */
  async getHorasConducao(motoristaId: string) {
    await this.findById(motoristaId);

    const agora = new Date();
    const inicio24h = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

    const [viagensRows, descansosRows, paradasRows] = await Promise.all([
      this.db.query(
        `SELECT data_partida, data_chegada_real, status FROM viagens
         WHERE motorista_id = $1 AND data_partida >= $2
         ORDER BY data_partida ASC`,
        [motoristaId, inicio24h.toISOString()],
      ),
      this.db.query(
        `SELECT inicio, fim, tipo FROM descansos
         WHERE motorista_id = $1 AND inicio >= $2
         ORDER BY inicio ASC`,
        [motoristaId, inicio24h.toISOString()],
      ),
      this.db.query(
        `SELECT vp.inicio, vp.fim, vp.tipo FROM viagem_paradas vp
         JOIN viagens v ON v.id = vp.viagem_id
         WHERE v.motorista_id = $1 AND vp.inicio >= $2
         ORDER BY vp.inicio ASC`,
        [motoristaId, inicio24h.toISOString()],
      ),
    ]);

    // Calcular horas totais de conducao nas ultimas 24h
    let horasTotal24h = 0;
    for (const v of viagensRows) {
      const fim = v.data_chegada_real ? new Date(v.data_chegada_real) : agora;
      const inicio = new Date(v.data_partida);
      horasTotal24h += (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60);
    }

    // Descontar paradas da conducao total
    let horasParadas = 0;
    for (const p of [...descansosRows, ...paradasRows]) {
      const fim = p.fim ? new Date(p.fim) : agora;
      const inicio = new Date(p.inicio);
      horasParadas += (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60);
    }
    horasTotal24h = Math.max(0, horasTotal24h - horasParadas);

    // Calcular horas continuas (desde ultima parada >= 30min)
    const todasParadas = [...descansosRows, ...paradasRows]
      .map(p => ({
        inicio: new Date(p.inicio),
        fim: p.fim ? new Date(p.fim) : agora,
        duracao: ((p.fim ? new Date(p.fim).getTime() : agora.getTime()) - new Date(p.inicio).getTime()) / (1000 * 60),
      }))
      .filter(p => p.duracao >= 30)
      .sort((a, b) => b.fim.getTime() - a.fim.getTime());

    const ultimaParadaLonga = todasParadas.length > 0 ? todasParadas[0].fim : inicio24h;

    let horasContinuas = 0;
    for (const v of viagensRows) {
      const vInicio = new Date(v.data_partida);
      const vFim = v.data_chegada_real ? new Date(v.data_chegada_real) : agora;
      if (vFim > ultimaParadaLonga) {
        const efetivo = Math.max(vInicio.getTime(), ultimaParadaLonga.getTime());
        horasContinuas += (vFim.getTime() - efetivo) / (1000 * 60 * 60);
      }
    }

    // Descontar paradas curtas (<30min) do periodo continuo
    for (const p of [...descansosRows, ...paradasRows]) {
      const pInicio = new Date(p.inicio);
      const pFim = p.fim ? new Date(p.fim) : agora;
      const durMin = (pFim.getTime() - pInicio.getTime()) / (1000 * 60);
      if (durMin < 30 && pInicio > ultimaParadaLonga) {
        horasContinuas = Math.max(0, horasContinuas - durMin / 60);
      }
    }

    const LIMITE_CONTINUO = 5.5;
    const LIMITE_DIARIO = 11;

    const alertas: string[] = [];
    if (horasContinuas >= 4.5) alertas.push('Proximo do limite de 5.5h continuas - pare em breve');
    if (horasContinuas >= LIMITE_CONTINUO) alertas.push('LIMITE de 5.5h continuas ATINGIDO - parada obrigatoria de 30min');
    if (horasTotal24h >= 9.5) alertas.push('Proximo do limite diario de 11h');
    if (horasTotal24h >= LIMITE_DIARIO) alertas.push('LIMITE diario de 11h ATINGIDO - conducao proibida');

    return {
      motoristaId,
      horasContinuas: Math.round(horasContinuas * 100) / 100,
      horasTotal24h: Math.round(horasTotal24h * 100) / 100,
      horasDescanso: Math.round(horasParadas * 100) / 100,
      limiteContinuo: LIMITE_CONTINUO,
      limiteDiario: LIMITE_DIARIO,
      horasRestantesContinuas: Math.max(0, Math.round((LIMITE_CONTINUO - horasContinuas) * 100) / 100),
      horasRestantesDiarias: Math.max(0, Math.round((LIMITE_DIARIO - horasTotal24h) * 100) / 100),
      conforme: horasContinuas <= LIMITE_CONTINUO && horasTotal24h <= LIMITE_DIARIO,
      alertaContinuo: horasContinuas >= 4.5,
      alertaDiario: horasTotal24h >= 9.5,
      alertas,
    };
  }

  async getViagens(motoristaId: string, page = 1, limit = 20) {
    await this.findById(motoristaId);
    const offset = (page - 1) * limit;
    const [rows, countResult] = await Promise.all([
      this.db.query(
        `SELECT * FROM viagens WHERE motorista_id = $1 ORDER BY data_partida DESC LIMIT $2 OFFSET $3`,
        [motoristaId, limit, offset],
      ),
      this.db.queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM viagens WHERE motorista_id = $1`, [motoristaId],
      ),
    ]);
    const total = parseInt(countResult?.count ?? '0', 10);
    return { data: rows, total, page, limit, hasMore: offset + rows.length < total };
  }

  async getDocumentos(motoristaId: string) {
    await this.findById(motoristaId);
    return this.db.query(
      `SELECT * FROM documents WHERE aggregate_id = $1 AND aggregate_type = 'motorista' ORDER BY created_at DESC`,
      [motoristaId],
    );
  }

  async getAlertas(motoristaId: string) {
    await this.findById(motoristaId);
    return this.db.query(
      `SELECT * FROM alerts WHERE entity_id = $1 AND entity_type = 'motorista' AND status != 'EXPIRED' ORDER BY due_date ASC`,
      [motoristaId],
    );
  }
}
