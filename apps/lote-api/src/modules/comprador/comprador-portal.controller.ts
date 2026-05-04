import {
  Controller, Get, UseGuards, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { DatabaseService } from '@compliancecore/sdk';

@ApiTags('comprador-portal')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('comprador')
export class CompradorPortalController {
  constructor(private readonly db: DatabaseService) {}

  private async findCompradorByUser(userEmail: string) {
    const comprador = await this.db.queryOne(
      `SELECT * FROM compradores WHERE email = $1 LIMIT 1`,
      [userEmail],
    );
    if (!comprador) throw new NotFoundException('Comprador nao encontrado para este usuario');
    return comprador;
  }

  @Get('meu-lote')
  @ApiOperation({ summary: 'Dados do lote do comprador logado' })
  async meuLote(@CurrentUser() user: AuthUser) {
    const comprador = await this.findCompradorByUser(user.email);

    const result = await this.db.queryOne(
      `SELECT c.id as contrato_id, c.status as contrato_status,
              l.id as lote_id, l.quadra, l.numero, l.area_m2, l.valor_venda, l.status as lote_status,
              lt.id as loteamento_id, lt.nome as loteamento_nome, lt.cidade, lt.estado
       FROM contratos c
       JOIN lotes l ON l.id = c.lote_id
       JOIN loteamentos lt ON lt.id = c.loteamento_id
       WHERE c.comprador_id = $1 AND c.status != 'DISTRATADO'
       ORDER BY c.created_at DESC LIMIT 1`,
      [comprador.id],
    );

    return {
      comprador: { id: comprador.id, nome: comprador.nome, email: comprador.email },
      lote: result ? { id: result.lote_id, quadra: result.quadra, numero: result.numero, area_m2: result.area_m2, valor_venda: result.valor_venda, status: result.lote_status } : null,
      loteamento: result ? { id: result.loteamento_id, nome: result.loteamento_nome, cidade: result.cidade, estado: result.estado } : null,
      contrato: result ? { id: result.contrato_id, status: result.contrato_status } : null,
    };
  }

  @Get('parcelas')
  @ApiOperation({ summary: 'Parcelas do comprador logado' })
  async minhasParcelas(@CurrentUser() user: AuthUser) {
    const comprador = await this.findCompradorByUser(user.email);

    return this.db.query(
      `SELECT p.* FROM parcelas p
       JOIN contratos c ON c.id = p.contrato_id
       WHERE c.comprador_id = $1 AND c.status != 'DISTRATADO'
       ORDER BY p.numero`,
      [comprador.id],
    );
  }

  @Get('documentos')
  @ApiOperation({ summary: 'Documentos do loteamento do comprador' })
  async meusDocumentos(@CurrentUser() user: AuthUser) {
    const comprador = await this.findCompradorByUser(user.email);

    return this.db.query(
      `SELECT d.* FROM documents d
       JOIN contratos c ON d.aggregate_id = c.loteamento_id AND d.aggregate_type = 'loteamento'
       WHERE c.comprador_id = $1 AND d.vertical = 'lote'
       ORDER BY d.created_at DESC`,
      [comprador.id],
    );
  }
}
