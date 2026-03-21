import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { DatabaseService, ComplianceLogger } from '@compliancecore/sdk';
import { CreateTemplateDto, UpdateTemplateDto } from './template.dto';

@Injectable()
export class TemplateService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('TemplateService');
  }

  async create(dto: CreateTemplateDto) {
    const id = ulid();
    await this.db.query(
      `INSERT INTO laudo_templates (id, laboratorio_id, nome, tipo_exame, analitos, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [id, dto.laboratorioId || null, dto.nome, dto.tipoExame, JSON.stringify(dto.analitos)],
    );
    this.logger.log(`Template created: ${id}`);
    return this.findById(id);
  }

  async findAll(laboratorioId?: string) {
    if (laboratorioId) {
      return this.db.query(
        `SELECT * FROM laudo_templates WHERE (laboratorio_id = $1 OR laboratorio_id IS NULL) AND ativo = true ORDER BY nome`,
        [laboratorioId],
      );
    }
    return this.db.query(`SELECT * FROM laudo_templates WHERE ativo = true ORDER BY nome`);
  }

  async findById(id: string) {
    const tmpl = await this.db.queryOne(`SELECT * FROM laudo_templates WHERE id = $1`, [id]);
    if (!tmpl) throw new NotFoundException(`Template ${id} nao encontrado`);
    // Parse analitos from JSONB
    if (typeof tmpl.analitos === 'string') tmpl.analitos = JSON.parse(tmpl.analitos);
    return tmpl;
  }

  async update(id: string, dto: UpdateTemplateDto) {
    await this.findById(id);
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (dto.nome !== undefined) { fields.push(`nome = $${idx}`); values.push(dto.nome); idx++; }
    if (dto.tipoExame !== undefined) { fields.push(`tipo_exame = $${idx}`); values.push(dto.tipoExame); idx++; }
    if (dto.analitos !== undefined) { fields.push(`analitos = $${idx}`); values.push(JSON.stringify(dto.analitos)); idx++; }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = $${idx}`); values.push(new Date()); idx++;
    values.push(id);

    await this.db.query(`UPDATE laudo_templates SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    return this.findById(id);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.db.query(`UPDATE laudo_templates SET ativo = false, updated_at = NOW() WHERE id = $1`, [id]);
  }
}
