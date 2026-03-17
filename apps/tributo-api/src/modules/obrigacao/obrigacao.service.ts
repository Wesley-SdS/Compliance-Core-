import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService } from '@compliancecore/sdk/event-store/event-store.service';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';
import { CreateObrigacaoDto, UpdateObrigacaoStatusDto } from './obrigacao.dto';

@Injectable()
export class ObrigacaoService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('ObrigacaoService');
  }

  async create(dto: CreateObrigacaoDto, actorId: string) {
    const id = ulid();

    await this.db.query(
      `INSERT INTO obrigacoes_acessorias (id, empresa_id, nome, competencia, vencimento, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'pendente', NOW(), NOW())`,
      [id, dto.empresaId, dto.nome, dto.competencia, dto.vencimento],
    );

    await this.eventStore.append(dto.empresaId, 'empresa', 'OBRIGACAO_CRIADA', {
      obrigacaoId: id, nome: dto.nome, vencimento: dto.vencimento,
    }, {
      actorId, actorRole: 'contador', ip: '0.0.0.0', correlationId: ulid(),
    });

    this.logger.log(`Obrigacao criada: ${id}`, { obrigacaoId: id });
    return this.findById(id);
  }

  async findAll(params: { empresaId?: string; status?: string }, page = 1, limit = 50) {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.empresaId) {
      conditions.push(`o.empresa_id = $${idx}`);
      values.push(params.empresaId);
      idx++;
    }
    if (params.status) {
      conditions.push(`o.status = $${idx}`);
      values.push(params.status);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    values.push(limit, offset);
    const rows = await this.db.query(
      `SELECT o.*, e.razao_social as empresa
       FROM obrigacoes_acessorias o
       LEFT JOIN empresas e ON e.id = o.empresa_id
       ${where}
       ORDER BY o.vencimento ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      values,
    );

    return rows;
  }

  async findById(id: string) {
    const obrigacao = await this.db.queryOne(
      `SELECT o.*, e.razao_social as empresa
       FROM obrigacoes_acessorias o
       LEFT JOIN empresas e ON e.id = o.empresa_id
       WHERE o.id = $1`, [id],
    );
    if (!obrigacao) throw new NotFoundException(`Obrigacao ${id} nao encontrada`);
    return obrigacao;
  }

  async updateStatus(id: string, dto: UpdateObrigacaoStatusDto, actorId: string) {
    const obrigacao = await this.findById(id);

    await this.db.query(
      `UPDATE obrigacoes_acessorias SET status = $1, updated_at = NOW() WHERE id = $2`,
      [dto.status, id],
    );

    await this.eventStore.append(obrigacao.empresa_id, 'empresa', 'OBRIGACAO_STATUS_ATUALIZADO', {
      obrigacaoId: id, statusAnterior: obrigacao.status, statusNovo: dto.status,
    }, {
      actorId, actorRole: 'contador', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }
}
