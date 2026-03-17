import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClerkAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { LoteService } from './lote.service';
import { CreateLoteDto, UpdateLoteDto, SimularFinanciamentoDto } from './lote.dto';

@ApiTags('lotes')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('lotes')
export class LoteController {
  constructor(private readonly loteService: LoteService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo lote' })
  create(@Body() dto: CreateLoteDto, @CurrentUser() user: AuthUser) {
    return this.loteService.create(dto, user.id);
  }

  @Get('loteamento/:loteamentoId')
  @ApiOperation({ summary: 'Listar lotes de um loteamento' })
  findByLoteamento(@Param('loteamentoId') loteamentoId: string) {
    return this.loteService.findByLoteamento(loteamentoId);
  }

  @Get('loteamento/:loteamentoId/disponiveis')
  @ApiOperation({ summary: 'Listar lotes disponiveis' })
  getDisponiveis(@Param('loteamentoId') loteamentoId: string) {
    return this.loteService.getDisponiveis(loteamentoId);
  }

  @Get('loteamento/:loteamentoId/resumo')
  @ApiOperation({ summary: 'Resumo de status dos lotes' })
  getResumo(@Param('loteamentoId') loteamentoId: string) {
    return this.loteService.getResumo(loteamentoId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar lote por ID' })
  findById(@Param('id') id: string) {
    return this.loteService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar lote' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLoteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.loteService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir lote' })
  delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.loteService.delete(id, user.id);
  }

  @Post('simular-financiamento')
  @ApiOperation({ summary: 'Simular financiamento de lote (Price/SAC)' })
  simularFinanciamento(@Body() dto: SimularFinanciamentoDto) {
    return this.loteService.simularFinanciamento(dto);
  }
}
