import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService, DatabaseService } from '@compliancecore/sdk';

export interface Procedimento {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
  riscos: string[];
  requisitosProfissional: string[];
  equipamentosNecessarios: string[];
  documentosObrigatorios: string[];
  popId?: string;
  popUpdatedAt?: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

import { CreateProcedimentoDto, UpdateProcedimentoDto } from './procedimento.dto';
export { CreateProcedimentoDto, UpdateProcedimentoDto };

@Injectable()
export class ProcedimentoService {
  private readonly logger = new Logger(ProcedimentoService.name);

  constructor(
    private readonly eventStore: EventStoreService,
    private readonly db: DatabaseService,
  ) {}

  async create(
    dto: CreateProcedimentoDto,
    actorId: string,
  ): Promise<Procedimento> {
    const id = ulid();
    const now = new Date();

    const procedimento: Procedimento = {
      id,
      nome: dto.nome,
      tipo: dto.tipo,
      descricao: dto.descricao,
      riscos: dto.riscos || [],
      requisitosProfissional: dto.requisitosProfissional || [],
      equipamentosNecessarios: dto.equipamentosNecessarios || [],
      documentosObrigatorios: dto.documentosObrigatorios || [],
      ativo: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.query(
      `INSERT INTO procedimentos (id, data, created_at, updated_at)
       VALUES ($1, $2, $3, $4)`,
      [id, JSON.stringify(procedimento), now, now],
    );

    await this.eventStore.append(
      id,
      'Procedimento',
      'PROCEDIMENTO_CREATED',
      { nome: dto.nome, tipo: dto.tipo },
      {
        actorId,
        actorRole: 'admin',
        ip: '0.0.0.0',
        correlationId: ulid(),
      },
    );

    this.logger.log(`Procedimento created: ${procedimento.nome} (${id})`);
    return procedimento;
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Procedimento[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    const offset = (page - 1) * limit;

    const countResult = await this.db.queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM procedimentos WHERE data->>'ativo' = 'true'",
    );
    const total = parseInt(countResult?.count ?? '0', 10);

    const rows = await this.db.query<{ data: Procedimento }>(
      "SELECT data FROM procedimentos WHERE data->>'ativo' = 'true' ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [limit, offset],
    );

    const data = rows.map((r) => r.data);
    return { data, total, page, limit, hasMore: offset + data.length < total };
  }

  async findOne(id: string): Promise<Procedimento> {
    const row = await this.db.queryOne<{ data: Procedimento }>(
      'SELECT data FROM procedimentos WHERE id = $1',
      [id],
    );
    if (!row) {
      throw new NotFoundException(`Procedimento ${id} nao encontrado`);
    }
    return row.data;
  }

  async update(
    id: string,
    dto: UpdateProcedimentoDto,
    actorId: string,
  ): Promise<Procedimento> {
    const existing = await this.findOne(id);
    const now = new Date();

    const updated: Procedimento = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(dto).filter(([_, v]) => v !== undefined),
      ),
      updatedAt: now,
    };

    await this.db.query(
      'UPDATE procedimentos SET data = $1, updated_at = $2 WHERE id = $3',
      [JSON.stringify(updated), now, id],
    );

    await this.eventStore.append(
      id,
      'Procedimento',
      'PROCEDIMENTO_UPDATED',
      { changes: dto },
      {
        actorId,
        actorRole: 'admin',
        ip: '0.0.0.0',
        correlationId: ulid(),
      },
    );

    this.logger.log(`Procedimento updated: ${updated.nome} (${id})`);
    return updated;
  }

  async delete(id: string, actorId: string): Promise<void> {
    const existing = await this.findOne(id);

    const updated: Procedimento = {
      ...existing,
      ativo: false,
      updatedAt: new Date(),
    };

    await this.db.query(
      'UPDATE procedimentos SET data = $1, updated_at = $2 WHERE id = $3',
      [JSON.stringify(updated), updated.updatedAt, id],
    );

    await this.eventStore.append(
      id,
      'Procedimento',
      'PROCEDIMENTO_DELETED',
      { deletedAt: new Date() },
      {
        actorId,
        actorRole: 'admin',
        ip: '0.0.0.0',
        correlationId: ulid(),
      },
    );

    this.logger.log(`Procedimento deleted (soft): ${id}`);
  }

  async findByTipo(tipo: string): Promise<Procedimento[]> {
    const rows = await this.db.query<{ data: Procedimento }>(
      `SELECT data FROM procedimentos
       WHERE data->>'tipo' = $1 AND data->>'ativo' = 'true'
       ORDER BY created_at DESC`,
      [tipo],
    );
    return rows.map((r) => r.data);
  }
}
