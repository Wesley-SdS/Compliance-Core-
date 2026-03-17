import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService } from '@compliancecore/sdk/event-store/event-store.service';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';

import { CreateEquipamentoDto, UpdateEquipamentoDto, RegistrarCalibracaoDto } from './equipamento.dto';
export { CreateEquipamentoDto, UpdateEquipamentoDto, RegistrarCalibracaoDto };

@Injectable()
export class EquipamentoService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('EquipamentoService');
  }

  async create(dto: CreateEquipamentoDto, actorId: string) {
    const id = ulid();

    await this.db.query(
      `INSERT INTO equipamentos (id, laboratorio_id, nome, fabricante, modelo, numero_serie,
        data_aquisicao, proxima_calibracao, rastreabilidade, calibracao_valida, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, 'ATIVO', NOW(), NOW())`,
      [id, dto.laboratorioId, dto.nome, dto.fabricante, dto.modelo, dto.numeroSerie,
        dto.dataAquisicao, dto.proximaCalibracao, dto.rastreabilidade ?? false],
    );

    await this.eventStore.append(dto.laboratorioId, 'laboratorio', 'EQUIPAMENTO_CREATED', { equipamentoId: id, ...dto }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }

  async findByLaboratorio(laboratorioId: string) {
    return this.db.query(
      `SELECT * FROM equipamentos WHERE laboratorio_id = $1 ORDER BY nome ASC`,
      [laboratorioId],
    );
  }

  async findById(id: string) {
    const equip = await this.db.queryOne(`SELECT * FROM equipamentos WHERE id = $1`, [id]);
    if (!equip) throw new NotFoundException(`Equipamento ${id} nao encontrado`);
    return equip;
  }

  async update(id: string, dto: UpdateEquipamentoDto, actorId: string) {
    const equip = await this.findById(id);
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

    if (fields.length === 0) return equip;

    fields.push(`updated_at = $${idx}`);
    values.push(new Date());
    idx++;
    values.push(id);

    await this.db.query(`UPDATE equipamentos SET ${fields.join(', ')} WHERE id = $${idx}`, values);

    await this.eventStore.append(equip.laboratorio_id, 'laboratorio', 'EQUIPAMENTO_UPDATED', { equipamentoId: id, changes: dto }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }

  async delete(id: string, actorId: string) {
    const equip = await this.findById(id);
    await this.db.query(`DELETE FROM equipamentos WHERE id = $1`, [id]);

    await this.eventStore.append(equip.laboratorio_id, 'laboratorio', 'EQUIPAMENTO_DELETED', { equipamentoId: id }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });
  }

  async registrarCalibracao(id: string, dto: RegistrarCalibracaoDto, actorId: string) {
    const equip = await this.findById(id);
    const calibracaoId = ulid();

    await this.db.query(
      `INSERT INTO calibracoes (id, equipamento_id, data_calibracao, proxima_calibracao,
        laboratorio_calibrador, certificado_numero, resultado, observacoes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [calibracaoId, id, dto.dataCalibracao, dto.proximaCalibracao,
        dto.laboratorioCalibrador, dto.certificadoNumero, dto.resultado, dto.observacoes || null],
    );

    const calibracaoValida = dto.resultado !== 'REPROVADO';
    await this.db.query(
      `UPDATE equipamentos SET proxima_calibracao = $1, calibracao_valida = $2, updated_at = NOW() WHERE id = $3`,
      [dto.proximaCalibracao, calibracaoValida, id],
    );

    await this.eventStore.append(equip.laboratorio_id, 'laboratorio', 'CALIBRACAO_REGISTRADA', {
      equipamentoId: id, calibracaoId, resultado: dto.resultado,
    }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return { calibracaoId, equipamentoId: id, resultado: dto.resultado, calibracaoValida };
  }

  async getHistoricoCalibracao(id: string) {
    await this.findById(id);
    return this.db.query(
      `SELECT * FROM calibracoes WHERE equipamento_id = $1 ORDER BY data_calibracao DESC`,
      [id],
    );
  }

  async getVencidos(laboratorioId: string) {
    return this.db.query(
      `SELECT * FROM equipamentos WHERE laboratorio_id = $1 AND proxima_calibracao < NOW() AND status = 'ATIVO'`,
      [laboratorioId],
    );
  }
}
