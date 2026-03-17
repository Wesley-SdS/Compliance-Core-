import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ulid } from 'ulid';
import {
  EventStoreService,
  VektusAdapterService,
  DatabaseService,
  ComplianceLogger,
} from '@compliancecore/sdk';
import { CreateMaterialDto, UpdateMaterialDto } from './material.dto';
import { TransferirMaterialDto } from '../obra/obra.dto';
import { TransferirMaterialUseCase } from '../obra/use-cases/transferir-material.use-case';

@Injectable()
export class MaterialService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly vektus: VektusAdapterService,
    private readonly logger: ComplianceLogger,
    private readonly transferirMaterialUseCase: TransferirMaterialUseCase,
  ) {
    this.logger.setContext('MaterialService');
  }

  async create(dto: CreateMaterialDto, actorId: string) {
    const id = ulid();

    await this.db.query(
      `INSERT INTO materiais (id, obra_id, nome, descricao, quantidade, unidade, fornecedor, nota_fiscal, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDENTE', NOW(), NOW())`,
      [id, dto.obraId, dto.nome, dto.descricao || null, dto.quantidade, dto.unidade, dto.fornecedor || null, dto.notaFiscal || null],
    );

    await this.eventStore.append(dto.obraId, 'obra', 'MATERIAL_ADDED', { materialId: id, ...dto }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }

  async findByObra(obraId: string) {
    return this.db.query(
      `SELECT * FROM materiais WHERE obra_id = $1 AND (status IS NULL OR status != 'CANCELADO') ORDER BY created_at DESC`,
      [obraId],
    );
  }

  async findById(id: string) {
    const material = await this.db.queryOne(`SELECT * FROM materiais WHERE id = $1`, [id]);
    if (!material) throw new NotFoundException(`Material ${id} nao encontrado`);
    return material;
  }

  async update(id: string, dto: UpdateMaterialDto, actorId: string) {
    const material = await this.findById(id);
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

    if (fields.length === 0) return material;

    fields.push(`updated_at = $${idx}`);
    values.push(new Date());
    idx++;
    values.push(id);

    await this.db.query(`UPDATE materiais SET ${fields.join(', ')} WHERE id = $${idx}`, values);

    await this.eventStore.append(material.obra_id, 'obra', 'MATERIAL_UPDATED', { materialId: id, changes: dto }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }

  async delete(id: string, actorId: string) {
    const material = await this.findById(id);
    await this.db.query(
      `UPDATE materiais SET status = 'CANCELADO', updated_at = NOW() WHERE id = $1`,
      [id],
    );

    await this.eventStore.append(material.obra_id, 'obra', 'MATERIAL_DELETED', { materialId: id }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });
  }

  async ocrNotaFiscal(id: string, content: string, actorId: string) {
    const material = await this.findById(id);

    const ingestResult = await this.vektus.ingest(content, {
      fileName: `nf_material_${id}.pdf`,
      vertical: 'obra',
      category: 'nota_fiscal_material',
      tags: ['material', id, 'nota_fiscal'],
    });

    await this.db.query(
      `UPDATE materiais SET nota_fiscal_vektus_id = $1, updated_at = NOW() WHERE id = $2`,
      [ingestResult.fileId, id],
    );

    await this.eventStore.append(material.obra_id, 'obra', 'MATERIAL_NF_OCR', {
      materialId: id,
      vektusFileId: ingestResult.fileId,
    }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return { materialId: id, vektusFileId: ingestResult.fileId, status: ingestResult.status };
  }

  async searchMaterial(query: string) {
    return this.vektus.search(query, {
      filters: { vertical: 'obra', category: 'nota_fiscal_material' },
      topK: 10,
    });
  }

  async transferir(dto: TransferirMaterialDto, actorId: string) {
    return this.transferirMaterialUseCase.execute(dto, actorId);
  }
}
