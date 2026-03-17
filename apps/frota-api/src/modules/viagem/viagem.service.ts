import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService } from '@compliancecore/sdk/event-store/event-store.service';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';

import { CreateViagemDto, UpdateViagemDto } from './viagem.dto';
export { CreateViagemDto, UpdateViagemDto };

@Injectable()
export class ViagemService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('ViagemService');
  }

  async create(dto: CreateViagemDto, actorId: string) {
    const id = ulid();

    await this.db.query(
      `INSERT INTO viagens (id, veiculo_id, motorista_id, origem, destino, distancia_km,
        carga_descricao, peso_kg, ciot_numero, data_partida, data_chegada_prevista,
        status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PLANEJADA', NOW(), NOW())`,
      [id, dto.veiculoId, dto.motoristaId, dto.origem, dto.destino,
        dto.distanciaKm || null, dto.cargaDescricao || null, dto.pesoKg || null,
        dto.ciotNumero || null, dto.dataPartida, dto.dataChegadaPrevista],
    );

    await this.db.query(
      `UPDATE motoristas SET em_viagem = true, updated_at = NOW() WHERE id = $1`,
      [dto.motoristaId],
    );

    await this.eventStore.append(id, 'viagem', 'VIAGEM_CREATED', { ...dto }, {
      actorId, actorRole: 'gestor_frota', ip: '0.0.0.0', correlationId: ulid(),
    });

    this.logger.log(`Viagem created: ${id}`, { viagemId: id });
    return this.findById(id);
  }

  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows, countResult] = await Promise.all([
      this.db.query(`SELECT * FROM viagens ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]),
      this.db.queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM viagens`),
    ]);
    const total = parseInt(countResult?.count ?? '0', 10);
    return { data: rows, total, page, limit, hasMore: offset + rows.length < total };
  }

  async findById(id: string) {
    const viagem = await this.db.queryOne(`SELECT * FROM viagens WHERE id = $1`, [id]);
    if (!viagem) throw new NotFoundException(`Viagem ${id} nao encontrada`);
    return viagem;
  }

  async update(id: string, dto: UpdateViagemDto, actorId: string) {
    const viagem = await this.findById(id);
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

    if (fields.length === 0) return viagem;

    fields.push(`updated_at = $${idx}`);
    values.push(new Date());
    idx++;
    values.push(id);

    await this.db.query(`UPDATE viagens SET ${fields.join(', ')} WHERE id = $${idx}`, values);

    if (dto.status === 'CONCLUIDA' || dto.status === 'CANCELADA') {
      await this.db.query(
        `UPDATE motoristas SET em_viagem = false, updated_at = NOW() WHERE id = $1`,
        [viagem.motorista_id],
      );
    }

    await this.eventStore.append(id, 'viagem', 'VIAGEM_UPDATED', { changes: dto }, {
      actorId, actorRole: 'gestor_frota', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }

  async delete(id: string, actorId: string) {
    const viagem = await this.findById(id);
    await this.db.query(`DELETE FROM viagens WHERE id = $1`, [id]);

    await this.db.query(
      `UPDATE motoristas SET em_viagem = false, updated_at = NOW() WHERE id = $1`,
      [viagem.motorista_id],
    );

    await this.eventStore.append(id, 'viagem', 'VIAGEM_DELETED', {}, {
      actorId, actorRole: 'gestor_frota', ip: '0.0.0.0', correlationId: ulid(),
    });
  }

  async findByVeiculo(veiculoId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows, countResult] = await Promise.all([
      this.db.query(
        `SELECT * FROM viagens WHERE veiculo_id = $1 ORDER BY data_partida DESC LIMIT $2 OFFSET $3`,
        [veiculoId, limit, offset],
      ),
      this.db.queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM viagens WHERE veiculo_id = $1`, [veiculoId],
      ),
    ]);
    const total = parseInt(countResult?.count ?? '0', 10);
    return { data: rows, total, page, limit, hasMore: offset + rows.length < total };
  }

  async findByMotorista(motoristaId: string, page = 1, limit = 20) {
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

  async getEmAndamento() {
    return this.db.query(
      `SELECT v.*, m.nome as motorista_nome, ve.placa as veiculo_placa
       FROM viagens v
       JOIN motoristas m ON m.id = v.motorista_id
       JOIN veiculos ve ON ve.id = v.veiculo_id
       WHERE v.status = 'EM_ANDAMENTO'
       ORDER BY v.data_partida ASC`,
    );
  }

  async getSemCiot() {
    return this.db.query(
      `SELECT * FROM viagens WHERE status IN ('PLANEJADA', 'EM_ANDAMENTO') AND ciot_numero IS NULL ORDER BY data_partida ASC`,
    );
  }
}
