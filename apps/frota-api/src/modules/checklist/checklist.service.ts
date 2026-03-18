import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService } from '@compliancecore/sdk/event-store/event-store.service';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';

import { CreateChecklistDto } from './checklist.dto';
export { CreateChecklistDto };

@Injectable()
export class ChecklistService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('ChecklistService');
  }

  async create(dto: CreateChecklistDto, actorId: string) {
    const id = ulid();
    const totalItems = dto.items.length;
    const conformes = dto.items.filter((i) => i.status === 'ok').length;
    const score = totalItems > 0 ? Math.round((conformes / totalItems) * 100) : 0;
    const status = score === 100 ? 'APROVADO' : score >= 70 ? 'PARCIAL' : 'REPROVADO';

    await this.db.query(
      `INSERT INTO checklists (id, veiculo_id, motorista_id, data, items, score, status, created_at)
       VALUES ($1, $2, $3, NOW(), $4, $5, $6, NOW())`,
      [id, dto.veiculoId, dto.motoristaId, JSON.stringify(dto.items), score, status],
    );

    await this.eventStore.append(id, 'checklist', 'CHECKLIST_SUBMITTED', {
      veiculoId: dto.veiculoId, motoristaId: dto.motoristaId, score, status,
    }, {
      actorId, actorRole: 'gestor_frota', ip: '0.0.0.0', correlationId: ulid(),
    });

    this.logger.log(`Checklist submitted: ${id}`, { checklistId: id, score, status });
    return { id, veiculoId: dto.veiculoId, motoristaId: dto.motoristaId, score, status, items: dto.items };
  }
}
