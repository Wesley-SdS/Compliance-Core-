import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService } from '@compliancecore/sdk/event-store/event-store.service';
import { ScoreEngineService } from '@compliancecore/sdk/score-engine/score-engine.service';
import { VektusAdapterService } from '@compliancecore/sdk/vektus/vektus-adapter.service';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';
import { FROTA_CRITERIA, FROTA_DOC_CATEGORIES } from '../../config/frota.config';

import { CreateVeiculoDto, UpdateVeiculoDto } from './veiculo.dto';
export { CreateVeiculoDto, UpdateVeiculoDto };

@Injectable()
export class VeiculoService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly scoreEngine: ScoreEngineService,
    private readonly vektus: VektusAdapterService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('VeiculoService');
  }

  async create(dto: CreateVeiculoDto, actorId: string) {
    const id = ulid();

    await this.db.query(
      `INSERT INTO veiculos (id, placa, renavam, marca, modelo, ano_fabricacao, ano_modelo,
        tipo_veiculo, capacidade_carga, tem_tacografo, crlv_validade, crlv_valido, ipva_quitado,
        seguro_valido, manutencao_em_dia, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, false, false, false, 'ATIVO', NOW(), NOW())`,
      [id, dto.placa, dto.renavam, dto.marca, dto.modelo, dto.anoFabricacao, dto.anoModelo,
        dto.tipoVeiculo, dto.capacidadeCarga || null, dto.temTacografo ?? false, dto.crlvValidade || null],
    );

    await this.eventStore.append(id, 'veiculo', 'VEICULO_CREATED', { ...dto }, {
      actorId, actorRole: 'gestor_frota', ip: '0.0.0.0', correlationId: ulid(),
    });

    this.logger.log(`Veiculo created: ${id}`, { veiculoId: id });
    return this.findById(id);
  }

  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows, countResult] = await Promise.all([
      this.db.query(`SELECT * FROM veiculos ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]),
      this.db.queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM veiculos`),
    ]);
    const total = parseInt(countResult?.count ?? '0', 10);
    return { data: rows, total, page, limit, hasMore: offset + rows.length < total };
  }

  async findById(id: string) {
    const veiculo = await this.db.queryOne(`SELECT * FROM veiculos WHERE id = $1`, [id]);
    if (!veiculo) throw new NotFoundException(`Veiculo ${id} nao encontrado`);
    return veiculo;
  }

  async update(id: string, dto: UpdateVeiculoDto, actorId: string) {
    await this.findById(id);
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

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = $${idx}`);
    values.push(new Date());
    idx++;
    values.push(id);

    await this.db.query(`UPDATE veiculos SET ${fields.join(', ')} WHERE id = $${idx}`, values);

    await this.eventStore.append(id, 'veiculo', 'VEICULO_UPDATED', { changes: dto }, {
      actorId, actorRole: 'gestor_frota', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }

  async delete(id: string, actorId: string) {
    await this.findById(id);
    await this.db.query(`DELETE FROM veiculos WHERE id = $1`, [id]);

    await this.eventStore.append(id, 'veiculo', 'VEICULO_DELETED', {}, {
      actorId, actorRole: 'gestor_frota', ip: '0.0.0.0', correlationId: ulid(),
    });
  }

  async calculateScore(id: string) {
    const veiculo = await this.findById(id);
    const [documents, motoristas, viagens, veiculos] = await Promise.all([
      this.db.query(`SELECT * FROM documents WHERE aggregate_id = $1 AND aggregate_type = 'veiculo'`, [id]),
      this.db.query(`SELECT * FROM motoristas WHERE status = 'ATIVO'`),
      this.db.query(`SELECT * FROM viagens WHERE veiculo_id = $1`, [id]),
      this.db.query(`SELECT * FROM veiculos WHERE status = 'ATIVO'`),
    ]);

    const entity = { ...veiculo, documents, motoristas, viagens, veiculos: [veiculo] };
    return this.scoreEngine.calculate(id, FROTA_CRITERIA, entity);
  }

  async getDocuments(id: string) {
    await this.findById(id);
    return this.db.query(
      `SELECT * FROM documents WHERE aggregate_id = $1 AND aggregate_type = 'veiculo' ORDER BY created_at DESC`, [id],
    );
  }

  async uploadDocument(id: string, file: { fileName: string; content: string; category: string }, actorId: string) {
    await this.findById(id);
    const docId = ulid();

    const ingestResult = await this.vektus.ingest(file.content, {
      fileName: file.fileName, vertical: 'frota', category: file.category, tags: ['veiculo', id],
    });

    await this.db.query(
      `INSERT INTO documents (id, aggregate_id, aggregate_type, vertical, file_name, file_key, file_size, mime_type, category, vektus_file_id, version, uploaded_by, created_at, updated_at)
       VALUES ($1, $2, 'veiculo', 'frota', $3, $4, $5, 'application/octet-stream', $6, $7, 1, $8, NOW(), NOW())`,
      [docId, id, file.fileName, `frota/${id}/${docId}`, file.content.length, file.category, ingestResult.fileId, actorId],
    );

    await this.eventStore.append(id, 'veiculo', 'DOCUMENT_UPLOADED', { docId, category: file.category }, {
      actorId, actorRole: 'gestor_frota', ip: '0.0.0.0', correlationId: ulid(),
    });

    return { docId, vektusFileId: ingestResult.fileId, status: ingestResult.status };
  }

  async getAlerts(id: string) {
    await this.findById(id);
    return this.db.query(
      `SELECT * FROM alerts WHERE entity_id = $1 AND entity_type = 'veiculo' AND status != 'EXPIRED' ORDER BY due_date ASC`, [id],
    );
  }

  async getChecklist(id: string) {
    await this.findById(id);
    return this.db.query(
      `SELECT * FROM checklists WHERE aggregate_id = $1 AND entity_type = 'veiculo' ORDER BY created_at DESC LIMIT 1`, [id],
    );
  }

  async getDossier(id: string) {
    const veiculo = await this.findById(id);
    const [documents, score, alerts, viagens] = await Promise.all([
      this.getDocuments(id),
      this.calculateScore(id).catch(() => null),
      this.getAlerts(id),
      this.db.query(`SELECT * FROM viagens WHERE veiculo_id = $1 ORDER BY created_at DESC LIMIT 50`, [id]),
    ]);

    return {
      veiculo, documents, score, alerts, viagens,
      docCategories: FROTA_DOC_CATEGORIES, generatedAt: new Date(),
    };
  }

  async getTimeline(id: string, page = 1, limit = 50) {
    await this.findById(id);
    return this.eventStore.getAuditTrail({
      aggregateId: id, aggregateType: 'veiculo', page, limit,
    });
  }
}
