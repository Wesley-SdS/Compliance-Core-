import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService, VektusAdapterService, DatabaseService, ComplianceLogger } from '@compliancecore/sdk';

import { UploadSpedDto } from './sped.dto';
import { SpedParser, SpedParseResult } from './sped-parser';
export { UploadSpedDto };

@Injectable()
export class SpedService {
  private readonly parser = new SpedParser();

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

    // Parse real do conteúdo SPED
    let parseResult: SpedParseResult;
    try {
      parseResult = this.parser.parse(dto.content);
    } catch (err: any) {
      throw new BadRequestException(`Erro ao parsear arquivo SPED: ${err.message}`);
    }

    if (parseResult.erros.length > 0 && !parseResult.abertura) {
      throw new BadRequestException(`Arquivo SPED inválido: ${parseResult.erros.slice(0, 5).join('; ')}`);
    }

    const ingestResult = await this.vektus.ingest(dto.content, {
      fileName: dto.fileName,
      vertical: 'tributo',
      category: `sped_${dto.tipoSped.toLowerCase()}`,
      tags: ['sped', dto.tipoSped, dto.empresaId],
    });

    await this.db.transaction(async (query: any) => {
      await query(
        `INSERT INTO sped_files (id, empresa_id, tipo_sped, competencia, file_name, file_key,
          vektus_file_id, status, total_registros, total_notas, valor_entradas, valor_saidas,
          icms_total, pis_total, cofins_total, ipi_total, parse_errors, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'PROCESSADO', $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())`,
        [id, dto.empresaId, dto.tipoSped, dto.competencia, dto.fileName,
          `tributo/sped/${dto.empresaId}/${id}`, ingestResult.fileId,
          parseResult.totalRegistros, parseResult.resumo.totalNotas,
          parseResult.resumo.valorTotalEntradas, parseResult.resumo.valorTotalSaidas,
          parseResult.resumo.icmsTotal, parseResult.resumo.pisTotal,
          parseResult.resumo.cofinsTotal, parseResult.resumo.ipiTotal,
          parseResult.erros.length > 0 ? JSON.stringify(parseResult.erros.slice(0, 50)) : null],
      );

      // Inserir itens de NF para análise detalhada
      for (const nf of parseResult.notasFiscais) {
        await query(
          `INSERT INTO sped_notas (id, sped_file_id, ind_oper, cod_mod, num_doc, chv_nfe, dt_doc,
            vl_doc, vl_bc_icms, vl_icms, vl_ipi, vl_pis, vl_cofins)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT DO NOTHING`,
          [ulid(), id, nf.indOper, nf.codMod, nf.numDoc, nf.chvNfe, nf.dtDoc,
            nf.vlDoc, nf.vlBcIcms, nf.vlIcms, nf.vlIpi, nf.vlPis, nf.vlCofins],
        );
      }
    });

    await this.eventStore.append(dto.empresaId, 'empresa', 'SPED_UPLOADED', {
      spedId: id, tipoSped: dto.tipoSped, competencia: dto.competencia,
      totalRegistros: parseResult.totalRegistros,
      totalNotas: parseResult.resumo.totalNotas,
      valorEntradas: parseResult.resumo.valorTotalEntradas,
      valorSaidas: parseResult.resumo.valorTotalSaidas,
    }, {
      actorId, actorRole: 'contador', ip: '0.0.0.0', correlationId: ulid(),
    });

    this.logger.log(`SPED uploaded e parseado: ${id}`, {
      spedId: id, tipo: dto.tipoSped,
      registros: parseResult.totalRegistros, notas: parseResult.resumo.totalNotas,
    });

    return {
      id, vektusFileId: ingestResult.fileId, status: 'PROCESSADO',
      resumo: parseResult.resumo,
      erros: parseResult.erros.length > 0 ? parseResult.erros.slice(0, 10) : undefined,
    };
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

    await this.db.transaction(async (query: any) => {
      await query(`DELETE FROM sped_notas WHERE sped_file_id = $1`, [id]);
      await query(`DELETE FROM sped_files WHERE id = $1`, [id]);
    });

    await this.eventStore.append(sped.empresa_id, 'empresa', 'SPED_DELETED', { spedId: id }, {
      actorId, actorRole: 'contador', ip: '0.0.0.0', correlationId: ulid(),
    });
  }
}
