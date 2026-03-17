import { Injectable, BadRequestException } from '@nestjs/common';
import { ulid } from 'ulid';
import {
  EventStoreService,
  DatabaseService,
  ComplianceLogger,
} from '@compliancecore/sdk';
import { TransferirMaterialDto } from '../obra.dto';

@Injectable()
export class TransferirMaterialUseCase {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('TransferirMaterialUseCase');
  }

  async execute(dto: TransferirMaterialDto, actorId: string) {
    // Validate material exists
    const material = await this.db.queryOne(
      `SELECT * FROM materiais WHERE id = $1`,
      [dto.materialId],
    );
    if (!material) throw new BadRequestException(`Material ${dto.materialId} nao encontrado`);

    // Validate stock
    const disponivel = parseFloat(material.quantidade);
    if (disponivel < dto.quantidade) {
      throw new BadRequestException(
        `Estoque insuficiente. Disponivel: ${disponivel}, solicitado: ${dto.quantidade}`,
      );
    }

    // Validate destination obra exists
    const obraDestino = await this.db.queryOne(
      `SELECT id FROM obras WHERE id = $1`,
      [dto.obraDestinoId],
    );
    if (!obraDestino) throw new BadRequestException(`Obra destino ${dto.obraDestinoId} nao encontrada`);

    const newMatId = ulid();

    // Wrap debit + credit in a transaction
    await this.db.transaction(async (query) => {
      const newQty = disponivel - dto.quantidade;
      await query(
        `UPDATE materiais SET quantidade = $1, updated_at = NOW() WHERE id = $2`,
        [newQty, dto.materialId],
      );

      await query(
        `INSERT INTO materiais (id, obra_id, nome, quantidade, unidade, fornecedor, nota_fiscal_id, lote, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [newMatId, dto.obraDestinoId, material.nome, dto.quantidade, material.unidade,
          material.fornecedor, material.nota_fiscal_id, material.lote],
      );
    });

    await this.eventStore.append(dto.obraOrigemId, 'obra', 'MATERIAL_TRANSFERIDO', {
      materialId: dto.materialId, novoMaterialId: newMatId,
      obraOrigem: dto.obraOrigemId, obraDestino: dto.obraDestinoId,
      quantidade: dto.quantidade,
    }, { actorId, actorRole: 'construtor', ip: '0.0.0.0', correlationId: ulid() });

    this.logger.log(`Material transferred: ${dto.quantidade} ${material.unidade} from ${dto.obraOrigemId} to ${dto.obraDestinoId}`);

    return { materialOrigem: dto.materialId, materialDestino: newMatId, quantidade: dto.quantidade };
  }
}
