import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService } from '@compliancecore/sdk/event-store/event-store.service';
import { VektusAdapterService } from '@compliancecore/sdk/vektus/vektus-adapter.service';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';

import { UploadSpedDto } from './sped.dto';
export { UploadSpedDto };

@Injectable()
export class SpedService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly vektus: VektusAdapterService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('SpedService');
  }

  async upload(dto: UploadSpedDto, actorId: string) {
    const id = ulid();

    const ingestResult = await this.vektus.ingest(dto.content, {
      fileName: dto.fileName,
      vertical: 'tributo',
      category: `sped_${dto.tipoSped.toLowerCase()}`,
      tags: ['sped', dto.tipoSped, dto.empresaId],
    });

    await this.db.query(
      `INSERT INTO sped_files (id, empresa_id, tipo_sped, competencia, file_name, file_key,
        vektus_file_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PROCESSANDO', NOW(), NOW())`,
      [id, dto.empresaId, dto.tipoSped, dto.competencia, dto.fileName,
        `tributo/sped/${dto.empresaId}/${id}`, ingestResult.fileId],
    );

    await this.eventStore.append(dto.empresaId, 'empresa', 'SPED_UPLOADED', {
      spedId: id, tipoSped: dto.tipoSped, competencia: dto.competencia,
    }, {
      actorId, actorRole: 'contador', ip: '0.0.0.0', correlationId: ulid(),
    });

    this.logger.log(`SPED uploaded: ${id}`, { spedId: id, tipo: dto.tipoSped });
    return { id, vektusFileId: ingestResult.fileId, status: 'PROCESSANDO' };
  }

  async findByEmpresa(empresaId: string) {
    return this.db.query(
      `SELECT * FROM sped_files WHERE empresa_id = $1 ORDER BY competencia DESC`,
      [empresaId],
    );
  }

  async findById(id: string) {
    const sped = await this.db.queryOne(`SELECT * FROM sped_files WHERE id = $1`, [id]);
    if (!sped) throw new NotFoundException(`SPED ${id} nao encontrado`);
    return sped;
  }

  async validate(id: string, actorId: string) {
    const sped = await this.findById(id);

    if (sped.vektus_file_id) {
      const fileStatus = await this.vektus.getFileStatus(sped.vektus_file_id);
      if (fileStatus.status !== 'completed') {
        return { id, status: 'AGUARDANDO_PROCESSAMENTO', vektusStatus: fileStatus.status };
      }
    }

    await this.db.query(
      `UPDATE sped_files SET status = 'VALIDADO', validated_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [id],
    );

    await this.eventStore.append(sped.empresa_id, 'empresa', 'SPED_VALIDATED', {
      spedId: id, tipoSped: sped.tipo_sped, competencia: sped.competencia,
    }, {
      actorId, actorRole: 'contador', ip: '0.0.0.0', correlationId: ulid(),
    });

    return { id, status: 'VALIDADO' };
  }

  async delete(id: string, actorId: string) {
    const sped = await this.findById(id);
    await this.db.query(`DELETE FROM sped_files WHERE id = $1`, [id]);

    await this.eventStore.append(sped.empresa_id, 'empresa', 'SPED_DELETED', { spedId: id }, {
      actorId, actorRole: 'contador', ip: '0.0.0.0', correlationId: ulid(),
    });
  }
}
