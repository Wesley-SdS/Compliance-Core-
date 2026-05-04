import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService, DatabaseService, ComplianceLogger } from '@compliancecore/sdk';

import { CreateManutencaoDto } from './manutencao.dto';
export { CreateManutencaoDto };

@Injectable()
export class ManutencaoService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('ManutencaoService');
  }

  async create(dto: CreateManutencaoDto, actorId: string) {
    const id = ulid();

    await this.db.query(
      `INSERT INTO manutencoes (id, veiculo_id, tipo, data, km, custo, fornecedor, descricao, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'CONCLUIDA', NOW())`,
      [id, dto.veiculoId, dto.tipo, dto.data, dto.km, dto.custo, dto.fornecedor || null, dto.descricao || null],
    );

    await this.eventStore.append(id, 'manutencao', 'MANUTENCAO_CREATED', { ...dto }, {
      actorId, actorRole: 'gestor_frota', ip: '0.0.0.0', correlationId: ulid(),
    });

    this.logger.log(`Manutencao created: ${id}`, { manutencaoId: id, veiculoId: dto.veiculoId });
    return { id, ...dto, status: 'CONCLUIDA' };
  }

  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows, countResult] = await Promise.all([
      this.db.query(
        `SELECT m.*, v.placa as veiculo_placa FROM manutencoes m
         LEFT JOIN veiculos v ON v.id = m.veiculo_id
         ORDER BY m.data DESC LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      this.db.queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM manutencoes`),
    ]);
    const total = parseInt(countResult?.count ?? '0', 10);
    return { data: rows, total, page, limit, hasMore: offset + rows.length < total };
  }

  async getAlertas() {
    const vencidas = await this.db.query(
      `SELECT m.*, v.placa as veiculo_placa FROM manutencoes m
       LEFT JOIN veiculos v ON v.id = m.veiculo_id
       WHERE m.status = 'AGENDADA' AND m.data < NOW()
       ORDER BY m.data ASC`,
    );

    const proximas = await this.db.query(
      `SELECT m.*, v.placa as veiculo_placa FROM manutencoes m
       LEFT JOIN veiculos v ON v.id = m.veiculo_id
       WHERE m.status = 'AGENDADA' AND m.data >= NOW() AND m.data <= NOW() + INTERVAL '30 days'
       ORDER BY m.data ASC`,
    );

    return { vencidas, proximas };
  }
}
