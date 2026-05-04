import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService, DatabaseService, ComplianceLogger } from '@compliancecore/sdk';

import { CreateAbastecimentoDto } from './abastecimento.dto';
export { CreateAbastecimentoDto };

@Injectable()
export class AbastecimentoService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('AbastecimentoService');
  }

  async create(dto: CreateAbastecimentoDto, actorId: string) {
    const id = ulid();

    await this.db.query(
      `INSERT INTO abastecimentos (id, veiculo_id, data, litros, valor_litro, total, posto, km, status_ocr, created_at)
       VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, 'PENDENTE', NOW())`,
      [id, dto.veiculoId, dto.litros, dto.valorLitro, dto.total, dto.posto || null, dto.km],
    );

    await this.eventStore.append(id, 'abastecimento', 'ABASTECIMENTO_CREATED', { ...dto }, {
      actorId, actorRole: 'gestor_frota', ip: '0.0.0.0', correlationId: ulid(),
    });

    this.logger.log(`Abastecimento created: ${id}`, { abastecimentoId: id, veiculoId: dto.veiculoId });
    return { id, ...dto, statusOcr: 'PENDENTE' };
  }

  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows, countResult] = await Promise.all([
      this.db.query(
        `SELECT a.*, v.placa as veiculo_placa FROM abastecimentos a
         LEFT JOIN veiculos v ON v.id = a.veiculo_id
         ORDER BY a.data DESC LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      this.db.queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM abastecimentos`),
    ]);
    const total = parseInt(countResult?.count ?? '0', 10);
    return { data: rows, total, page, limit, hasMore: offset + rows.length < total };
  }
}
