import { Injectable, Inject } from '@nestjs/common';
import { ulid } from 'ulid';
import {
  EventStoreService,
  DatabaseService,
  ComplianceLogger,
} from '@compliancecore/sdk';
import { CreateObraDto } from '../obra.dto';

@Injectable()
export class CriarObraUseCase {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('CriarObraUseCase');
  }

  async execute(dto: CreateObraDto, actorId: string) {
    const id = ulid();
    const now = new Date();

    await this.db.query(
      `INSERT INTO obras (id, nome, endereco, responsavel, tipo_obra, area_m2, numero_pavimentos,
        inicio_previsao, fim_previsao, cnpj_construtora, crea_responsavel, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PLANEJAMENTO', $12, $12)`,
      [id, dto.nome, dto.endereco, dto.responsavel, dto.tipoObra, dto.areaM2,
        dto.numeroPavimentos, dto.inicioPrevisao, dto.fimPrevisao,
        dto.cnpjConstrutora || null, dto.creaResponsavel || null, now],
    );

    await this.eventStore.append(id, 'obra', 'OBRA_CREATED', { ...dto }, {
      actorId,
      actorRole: 'admin',
      ip: '0.0.0.0',
      correlationId: ulid(),
    });

    this.logger.log(`Obra created: ${id}`, { obraId: id });

    const obra = await this.db.queryOne(`SELECT * FROM obras WHERE id = $1`, [id]);
    return obra;
  }
}
