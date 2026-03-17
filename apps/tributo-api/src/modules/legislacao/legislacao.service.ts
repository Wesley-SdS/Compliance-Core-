import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService } from '@compliancecore/sdk/event-store/event-store.service';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';
import { CreateLegislacaoDto } from './legislacao.dto';

@Injectable()
export class LegislacaoService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('LegislacaoService');
  }

  async create(dto: CreateLegislacaoDto, actorId: string) {
    const id = ulid();

    await this.db.query(
      `INSERT INTO legislacao (id, titulo, fonte, data, resumo, impacto, novo, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [id, dto.titulo, dto.fonte, dto.data, dto.resumo, dto.impacto, dto.novo ?? true],
    );

    await this.eventStore.append(id, 'legislacao', 'LEGISLACAO_CRIADA', {
      titulo: dto.titulo, impacto: dto.impacto,
    }, {
      actorId, actorRole: 'contador', ip: '0.0.0.0', correlationId: ulid(),
    });

    this.logger.log(`Legislacao criada: ${id}`, { legislacaoId: id });
    return this.findById(id);
  }

  async findAll(params: { impacto?: string }, page = 1, limit = 50) {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.impacto) {
      conditions.push(`impacto = $${idx}`);
      values.push(params.impacto);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    values.push(limit, offset);
    return this.db.query(
      `SELECT * FROM legislacao ${where} ORDER BY data DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      values,
    );
  }

  async findById(id: string) {
    const item = await this.db.queryOne(`SELECT * FROM legislacao WHERE id = $1`, [id]);
    if (!item) throw new NotFoundException(`Legislacao ${id} nao encontrada`);
    return item;
  }
}
