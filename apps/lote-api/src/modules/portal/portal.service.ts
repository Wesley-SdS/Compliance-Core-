import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';

@Injectable()
export class PortalService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('PortalService');
  }

  async getByToken(token: string) {
    const comprador = await this.db.queryOne(
      `SELECT * FROM compradores WHERE access_token = $1 AND status = 'ATIVO'`,
      [token],
    );
    if (!comprador) throw new NotFoundException('Token invalido ou comprador nao encontrado');

    const lote = await this.db.queryOne(
      `SELECT * FROM lotes WHERE comprador_id = $1`,
      [comprador.id],
    );

    const contrato = lote ? await this.db.queryOne(
      `SELECT * FROM contratos WHERE lote_id = $1 AND comprador_id = $2 AND status != 'DISTRATADO'`,
      [lote.id, comprador.id],
    ) : null;

    const parcelas = contrato ? await this.db.query(
      `SELECT * FROM parcelas WHERE contrato_id = $1 ORDER BY numero`,
      [contrato.id],
    ) : [];

    const infraestrutura = lote ? await this.db.query(
      `SELECT item, percentual FROM infraestrutura_itens WHERE loteamento_id = $1 ORDER BY item`,
      [lote.loteamento_id],
    ) : [];

    const documentos = comprador.loteamento_id ? await this.db.query(
      `SELECT id, file_name, category, created_at FROM loteamento_documents
       WHERE loteamento_id = $1 ORDER BY created_at DESC`,
      [comprador.loteamento_id],
    ) : [];

    return {
      comprador: {
        nome: comprador.nome,
        email: comprador.email,
      },
      lote: lote ? {
        quadra: lote.quadra,
        numero: lote.numero,
        areaM2: lote.area_m2,
        status: lote.status,
      } : null,
      contrato: contrato ? {
        id: contrato.id,
        valorTotal: contrato.valor_total,
        valorEntrada: contrato.valor_entrada,
        numeroParcelas: contrato.numero_parcelas,
        sistema: contrato.sistema,
        status: contrato.status,
      } : null,
      parcelas,
      infraestrutura,
      documentos,
    };
  }
}
