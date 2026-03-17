import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService } from '@compliancecore/sdk/event-store/event-store.service';
import { VektusAdapterService } from '@compliancecore/sdk/vektus/vektus-adapter.service';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';

import { CreateLaudoDto, UpdateLaudoDto } from './laudo.dto';
export { CreateLaudoDto, UpdateLaudoDto };

@Injectable()
export class LaudoService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly vektus: VektusAdapterService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('LaudoService');
  }

  async create(dto: CreateLaudoDto, actorId: string) {
    const id = ulid();

    await this.db.query(
      `INSERT INTO laudos (id, laboratorio_id, paciente_id, tipo_exame, material_biologico,
        metodologia, resultado, unidade, valor_referencia, observacoes, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'RASCUNHO', NOW(), NOW())`,
      [id, dto.laboratorioId, dto.pacienteId || null, dto.tipoExame, dto.materialBiologico,
        dto.metodologia, dto.resultado || null, dto.unidade || null,
        dto.valorReferencia || null, dto.observacoes || null],
    );

    await this.eventStore.append(dto.laboratorioId, 'laboratorio', 'LAUDO_CREATED', { laudoId: id, tipoExame: dto.tipoExame }, {
      actorId, actorRole: 'biomedico', ip: '0.0.0.0', correlationId: ulid(),
    });

    this.logger.log(`Laudo created: ${id}`, { laudoId: id });
    return this.findById(id);
  }

  async findByLaboratorio(laboratorioId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows, countResult] = await Promise.all([
      this.db.query(
        `SELECT * FROM laudos WHERE laboratorio_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [laboratorioId, limit, offset],
      ),
      this.db.queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM laudos WHERE laboratorio_id = $1`, [laboratorioId],
      ),
    ]);
    const total = parseInt(countResult?.count ?? '0', 10);
    return { data: rows, total, page, limit, hasMore: offset + rows.length < total };
  }

  async findById(id: string) {
    const laudo = await this.db.queryOne(`SELECT * FROM laudos WHERE id = $1`, [id]);
    if (!laudo) throw new NotFoundException(`Laudo ${id} nao encontrado`);
    return laudo;
  }

  async update(id: string, dto: UpdateLaudoDto, actorId: string) {
    const laudo = await this.findById(id);
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

    if (fields.length === 0) return laudo;

    fields.push(`updated_at = $${idx}`);
    values.push(new Date());
    idx++;
    values.push(id);

    await this.db.query(`UPDATE laudos SET ${fields.join(', ')} WHERE id = $${idx}`, values);

    await this.eventStore.append(laudo.laboratorio_id, 'laboratorio', 'LAUDO_UPDATED', { laudoId: id, changes: dto }, {
      actorId, actorRole: 'biomedico', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }

  async delete(id: string, actorId: string) {
    const laudo = await this.findById(id);
    await this.db.query(`DELETE FROM laudos WHERE id = $1`, [id]);

    await this.eventStore.append(laudo.laboratorio_id, 'laboratorio', 'LAUDO_DELETED', { laudoId: id }, {
      actorId, actorRole: 'biomedico', ip: '0.0.0.0', correlationId: ulid(),
    });
  }

  async aiReview(id: string, actorId: string) {
    const laudo = await this.findById(id);

    const reviewContext = `Tipo: ${laudo.tipo_exame}, Material: ${laudo.material_biologico}, Resultado: ${laudo.resultado}, Ref: ${laudo.valor_referencia}`;

    const skillsResult = await this.vektus.injectSkills('L2', reviewContext, {
      vertical: 'laudo',
    });

    const searchResults = await this.vektus.search(
      `${laudo.tipo_exame} ${laudo.resultado} interpretacao`,
      { filters: { vertical: 'laudo' }, topK: 5 },
    );

    await this.eventStore.append(laudo.laboratorio_id, 'laboratorio', 'LAUDO_AI_REVIEWED', {
      laudoId: id, tokensUsed: skillsResult.tokens, referencesFound: searchResults.length,
    }, {
      actorId, actorRole: 'biomedico', ip: '0.0.0.0', correlationId: ulid(),
    });

    return {
      laudoId: id,
      aiContext: skillsResult.context,
      references: searchResults,
      reviewedAt: new Date(),
    };
  }
}
