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
}
