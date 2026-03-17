import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClerkAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { CompradorService } from './comprador.service';
import { CreateCompradorDto, UpdateCompradorDto } from './comprador.dto';

@ApiTags('compradores')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('compradores')
export class CompradorController {
  constructor(private readonly compradorService: CompradorService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo comprador' })
  create(@Body() dto: CreateCompradorDto, @CurrentUser() user: AuthUser) {
    return this.compradorService.create(dto, user.id);
  }

  @Get('loteamento/:loteamentoId')
  @ApiOperation({ summary: 'Listar compradores de um loteamento' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByLoteamento(
    @Param('loteamentoId') loteamentoId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.compradorService.findByLoteamento(loteamentoId, page, limit);
  }

  @Get('loteamento/:loteamentoId/sem-consentimento')
  @ApiOperation({ summary: 'Listar compradores sem consentimento LGPD' })
  getSemConsentimento(@Param('loteamentoId') loteamentoId: string) {
    return this.compradorService.getSemConsentimento(loteamentoId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar comprador por ID' })
  findById(@Param('id') id: string) {
    return this.compradorService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar comprador' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCompradorDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.compradorService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir comprador' })
  delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.compradorService.delete(id, user.id);
  }

  @Post(':id/lgpd/consentir')
  @ApiOperation({ summary: 'Registrar consentimento LGPD do comprador' })
  registrarConsentimentoLgpd(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.compradorService.registrarConsentimentoLgpd(id, user.id);
  }

  @Post(':id/lgpd/revogar')
  @ApiOperation({ summary: 'Revogar consentimento LGPD do comprador' })
  revogarConsentimentoLgpd(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.compradorService.revogarConsentimentoLgpd(id, user.id);
  }
}
