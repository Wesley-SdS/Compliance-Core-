import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService, DatabaseService, ComplianceLogger } from '@compliancecore/sdk';

import { RegistrarFotoDto } from './foto.dto';

@Injectable()
export class FotoService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('FotoService');
  }

  async registrar(dto: RegistrarFotoDto, actorId: string) {
    const id = ulid();
    await this.db.query(
      `INSERT INTO fotos_obra (id, obra_id, etapa_id, url, latitude, longitude, descricao, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [id, dto.obraId, dto.etapaId || null, dto.url, dto.latitude, dto.longitude, dto.descricao || null],
    );

    await this.eventStore.append(dto.obraId, 'obra', 'FOTO_REGISTRADA', {
      fotoId: id, latitude: dto.latitude, longitude: dto.longitude, etapaId: dto.etapaId,
    }, { actorId, actorRole: 'construtor', ip: '0.0.0.0', correlationId: ulid() });

    this.logger.log(`Foto registrada: ${id}`, { obraId: dto.obraId, fotoId: id });
    return this.findById(id);
  }

  async findByObra(obraId: string) {
    return this.db.query(
      `SELECT * FROM fotos_obra WHERE obra_id = $1 ORDER BY created_at DESC`,
      [obraId],
    );
  }

  async findByEtapa(obraId: string, etapaId: string) {
    return this.db.query(
      `SELECT * FROM fotos_obra WHERE obra_id = $1 AND etapa_id = $2 ORDER BY created_at DESC`,
      [obraId, etapaId],
    );
  }

  async findById(id: string) {
    return this.db.queryOne(`SELECT * FROM fotos_obra WHERE id = $1`, [id]);
  }
}
