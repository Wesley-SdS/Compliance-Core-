import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { createHash } from 'crypto';
import { EventStoreService, DatabaseService, ComplianceLogger } from '@compliancecore/sdk';
import { CreateDecisaoDto } from './decisao.dto';

@Injectable()
export class DecisaoService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('DecisaoService');
  }

  async create(dto: CreateDecisaoDto, actorId: string) {
    const id = ulid();
    const payload = JSON.stringify({
      id, empresaId: dto.empresaId, descricao: dto.descricao,
      fundamentacaoLegal: dto.fundamentacaoLegal, simulacaoId: dto.simulacaoId,
      actorId, timestamp: new Date().toISOString(),
    });
    const assinatura = createHash('sha256').update(payload).digest('hex');

    await this.db.transaction(async (query: any) => {
      await query(
        `INSERT INTO decisoes_fiscais (id, empresa_id, descricao, fundamentacao_legal, simulacao_id, assinatura, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [id, dto.empresaId, dto.descricao, dto.fundamentacaoLegal, dto.simulacaoId || null, assinatura, actorId],
      );

      // Vincular decisão à simulação se fornecida
      if (dto.simulacaoId) {
        await query(
          `UPDATE calculos_tributarios SET decisao_id = $1, updated_at = NOW() WHERE id = $2`,
          [id, dto.simulacaoId],
        );
      }
    });

    await this.eventStore.append(dto.empresaId, 'empresa', 'DECISAO_FISCAL_REGISTRADA', {
      decisaoId: id, fundamentacaoLegal: dto.fundamentacaoLegal, assinatura,
    }, {
      actorId, actorRole: 'contador', ip: '0.0.0.0', correlationId: ulid(),
    });

    this.logger.log(`Decisao fiscal registrada: ${id}`, { decisaoId: id, empresaId: dto.empresaId });
    return this.findById(id);
  }

  async findByEmpresa(empresaId: string) {
    return this.db.query(
      `SELECT * FROM decisoes_fiscais WHERE empresa_id = $1 ORDER BY created_at DESC`,
      [empresaId],
    );
  }

  async findById(id: string) {
    const decisao = await this.db.queryOne(
      `SELECT * FROM decisoes_fiscais WHERE id = $1`, [id],
    );
    if (!decisao) throw new NotFoundException(`Decisao ${id} nao encontrada`);
    return decisao;
  }
}
