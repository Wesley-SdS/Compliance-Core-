import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService, DatabaseService } from '@compliancecore/sdk';
import { GerarPOPUseCase, POPOutput } from '../../use-cases/gerar-pop.use-case';
import { GeneratePopDto, ApprovePopDto } from './pop.dto';

export type Pop = POPOutput & {
  aprovadoPor?: string;
  aprovadoEm?: Date;
};

@Injectable()
export class PopService {
  private readonly logger = new Logger(PopService.name);

  constructor(
    private readonly eventStore: EventStoreService,
    private readonly db: DatabaseService,
    private readonly gerarPOPUseCase: GerarPOPUseCase,
  ) {}

  async generate(dto: GeneratePopDto, actorId: string): Promise<Pop> {
    const pop = await this.gerarPOPUseCase.execute({
      procedimentoId: dto.procedimentoId,
      procedimentoNome: dto.procedimentoNome,
      procedimentoTipo: dto.procedimentoTipo,
      contextoAdicional: dto.contextoAdicional,
      actorId,
    });

    return pop as Pop;
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Pop[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    const offset = (page - 1) * limit;

    const countResult = await this.db.queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM pops',
    );
    const total = parseInt(countResult?.count ?? '0', 10);

    const rows = await this.db.query<{ data: Pop }>(
      'SELECT data FROM pops ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset],
    );

    const data = rows.map((r) => r.data);
    return { data, total, page, limit, hasMore: offset + data.length < total };
  }

  async findOne(id: string): Promise<Pop> {
    const row = await this.db.queryOne<{ data: Pop }>(
      'SELECT data FROM pops WHERE id = $1',
      [id],
    );
    if (!row) {
      throw new NotFoundException(`POP ${id} nao encontrado`);
    }
    return row.data;
  }

  async approve(
    id: string,
    dto: ApprovePopDto,
    actorId: string,
  ): Promise<Pop> {
    const pop = await this.findOne(id);
    const now = new Date();

    const updated: Pop = {
      ...pop,
      status: 'APROVADO',
      aprovadoPor: dto.aprovadoPor,
      aprovadoEm: now,
      updatedAt: now,
    };

    await this.db.query('UPDATE pops SET data = $1, updated_at = $2 WHERE id = $3', [
      JSON.stringify(updated),
      now,
      id,
    ]);

    // Mark previous versions as obsolete
    await this.db.query(
      `UPDATE pops SET data = jsonb_set(data::jsonb, '{status}', '"OBSOLETO"')::text
       WHERE data->>'procedimentoId' = $1 AND id != $2 AND data->>'status' = 'APROVADO'`,
      [pop.procedimentoId, id],
    );

    await this.eventStore.append(
      id,
      'Pop',
      'POP_APPROVED',
      {
        aprovadoPor: dto.aprovadoPor,
        observacoes: dto.observacoes,
        versao: pop.versao,
      },
      {
        actorId,
        actorRole: 'admin',
        ip: '0.0.0.0',
        correlationId: ulid(),
      },
    );

    this.logger.log(`POP approved: ${pop.titulo} v${pop.versao} by ${dto.aprovadoPor}`);
    return updated;
  }
}
