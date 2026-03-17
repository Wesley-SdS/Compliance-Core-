import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService } from '@compliancecore/sdk/event-store/event-store.service';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';

import { CreateCompradorDto, UpdateCompradorDto } from './comprador.dto';
export { CreateCompradorDto, UpdateCompradorDto };

@Injectable()
export class CompradorService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('CompradorService');
  }

  async create(dto: CreateCompradorDto, actorId: string) {
    const id = ulid();

    await this.db.query(
      `INSERT INTO compradores (id, loteamento_id, nome, cpf_cnpj, email, telefone, endereco,
        lgpd_consentimento, lgpd_consentimento_data, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ATIVO', NOW(), NOW())`,
      [id, dto.loteamentoId, dto.nome, dto.cpfCnpj, dto.email || null, dto.telefone || null,
        dto.endereco || null, dto.lgpdConsentimento ?? false, dto.lgpdConsentimentoData || null],
    );

    await this.eventStore.append(dto.loteamentoId, 'loteamento', 'COMPRADOR_CREATED', { compradorId: id, nome: dto.nome }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }

  async findByLoteamento(loteamentoId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows, countResult] = await Promise.all([
      this.db.query(
        `SELECT * FROM compradores WHERE loteamento_id = $1 ORDER BY nome ASC LIMIT $2 OFFSET $3`,
        [loteamentoId, limit, offset],
      ),
      this.db.queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM compradores WHERE loteamento_id = $1`, [loteamentoId],
      ),
    ]);
    const total = parseInt(countResult?.count ?? '0', 10);
    return { data: rows, total, page, limit, hasMore: offset + rows.length < total };
  }

  async findById(id: string) {
    const comprador = await this.db.queryOne(`SELECT * FROM compradores WHERE id = $1`, [id]);
    if (!comprador) throw new NotFoundException(`Comprador ${id} nao encontrado`);
    return comprador;
  }

  async update(id: string, dto: UpdateCompradorDto, actorId: string) {
    const comprador = await this.findById(id);
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

    if (fields.length === 0) return comprador;

    fields.push(`updated_at = $${idx}`);
    values.push(new Date());
    idx++;
    values.push(id);

    await this.db.query(`UPDATE compradores SET ${fields.join(', ')} WHERE id = $${idx}`, values);

    await this.eventStore.append(comprador.loteamento_id, 'loteamento', 'COMPRADOR_UPDATED', { compradorId: id, changes: dto }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return this.findById(id);
  }

  async delete(id: string, actorId: string) {
    const comprador = await this.findById(id);
    await this.db.query(`DELETE FROM compradores WHERE id = $1`, [id]);

    await this.eventStore.append(comprador.loteamento_id, 'loteamento', 'COMPRADOR_DELETED', { compradorId: id }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });
  }

  async registrarConsentimentoLgpd(id: string, actorId: string) {
    const comprador = await this.findById(id);

    await this.db.query(
      `UPDATE compradores SET lgpd_consentimento = true, lgpd_consentimento_data = NOW(), updated_at = NOW() WHERE id = $1`,
      [id],
    );

    await this.eventStore.append(comprador.loteamento_id, 'loteamento', 'LGPD_CONSENTIMENTO_REGISTRADO', {
      compradorId: id, nome: comprador.nome,
    }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return { compradorId: id, lgpdConsentimento: true, registradoEm: new Date() };
  }

  async revogarConsentimentoLgpd(id: string, actorId: string) {
    const comprador = await this.findById(id);

    await this.db.query(
      `UPDATE compradores SET lgpd_consentimento = false, updated_at = NOW() WHERE id = $1`,
      [id],
    );

    await this.eventStore.append(comprador.loteamento_id, 'loteamento', 'LGPD_CONSENTIMENTO_REVOGADO', {
      compradorId: id, nome: comprador.nome,
    }, {
      actorId, actorRole: 'admin', ip: '0.0.0.0', correlationId: ulid(),
    });

    return { compradorId: id, lgpdConsentimento: false, revogadoEm: new Date() };
  }

  async getSemConsentimento(loteamentoId: string) {
    return this.db.query(
      `SELECT * FROM compradores WHERE loteamento_id = $1 AND lgpd_consentimento = false AND status = 'ATIVO' ORDER BY nome`,
      [loteamentoId],
    );
  }
}
