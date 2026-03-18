import {
  Controller, Get, Post, Patch,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { ContratoService } from './contrato.service';
import { CreateContratoDto, UpdateContratoDto, RegistrarPagamentoDto, GerarBoletoDto } from './contrato.dto';

@ApiTags('contratos')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller()
export class ContratoController {
  constructor(private readonly contratoService: ContratoService) {}

  @Post('contratos')
  @ApiOperation({ summary: 'Criar novo contrato' })
  create(@Body() dto: CreateContratoDto, @CurrentUser() user: AuthUser) {
    return this.contratoService.create(dto, user.id);
  }

  @Get('contratos/:id')
  @ApiOperation({ summary: 'Buscar contrato por ID' })
  findById(@Param('id') id: string) {
    return this.contratoService.findById(id);
  }

  @Patch('contratos/:id')
  @ApiOperation({ summary: 'Atualizar contrato' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateContratoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contratoService.update(id, dto, user.id);
  }

  @Post('contratos/:id/pagamento')
  @ApiOperation({ summary: 'Registrar pagamento de parcela' })
  registrarPagamento(
    @Param('id') id: string,
    @Body() dto: RegistrarPagamentoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contratoService.registrarPagamento(id, dto, user.id);
  }

  @Post('contratos/:id/distrato')
  @ApiOperation({ summary: 'Distratar contrato' })
  distratar(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.contratoService.distratar(id, user.id);
  }

  @Get('contratos/:id/parcelas')
  @ApiOperation({ summary: 'Listar parcelas do contrato' })
  getParcelas(@Param('id') id: string) {
    return this.contratoService.getParcelas(id);
  }

  @Post('contratos/:id/boleto')
  @ApiOperation({ summary: 'Gerar boleto para parcela' })
  gerarBoleto(
    @Param('id') id: string,
    @Body() dto: GerarBoletoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contratoService.gerarBoleto(id, dto, user.id);
  }

  @Get('loteamentos/:id/contratos')
  @ApiOperation({ summary: 'Listar contratos de um loteamento' })
  findByLoteamento(@Param('id') id: string) {
    return this.contratoService.findAll(id);
  }
}
