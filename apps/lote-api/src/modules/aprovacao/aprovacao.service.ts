import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService } from '@compliancecore/sdk/event-store/event-store.service';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';

import { CreateAprovacaoDto, UpdateAprovacaoDto } from './aprovacao.dto';
export { CreateAprovacaoDto, UpdateAprovacaoDto };

@Injectable()
export class AprovacaoService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('AprovacaoService');
  }

  async getByLoteamento(loteamentoId: string) {
    return this.db.query(
      `SELECT * FROM aprovacoes WHERE loteamento_id = $1 ORDER BY created_at DESC`,
      [loteamentoId],
    );
  }

  async create(dto: CreateAprovacaoDto, actorId: string) {
    const id = ulid();

    await this.db.query(
      `INSERT INTO aprovacoes (id, loteamento_id, tipo, protocolo, observacoes, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'PENDENTE', NOW(), NOW())`,
      [id, dto.loteamentoId, dto.tipo, dto.protocolo || null, dto.observacoes || null],
    );

    await this.eventStore.append(dto.loteamentoId, 'loteamento', 'APROVACAO_CREATED', {
      aprovacaoId: id, tipo: dto.tipo,
    }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }

  async findById(id: string) {
    const aprovacao = await this.db.queryOne(`SELECT * FROM aprovacoes WHERE id = $1`, [id]);
    if (!aprovacao) throw new NotFoundException(`Aprovacao ${id} nao encontrada`);
    return aprovacao;
  }

  async update(id: string, dto: UpdateAprovacaoDto, actorId: string) {
    const aprovacao = await this.findById(id);
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

    if (fields.length === 0) return aprovacao;

    fields.push(`updated_at = $${idx}`);
    values.push(new Date());
    idx++;
    values.push(id);

    await this.db.query(`UPDATE aprovacoes SET ${fields.join(', ')} WHERE id = $${idx}`, values);

    await this.eventStore.append(aprovacao.loteamento_id, 'loteamento', 'APROVACAO_UPDATED', {
      aprovacaoId: id, changes: dto,
    }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }
}
