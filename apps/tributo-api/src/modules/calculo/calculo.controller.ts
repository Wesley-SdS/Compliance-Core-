import {
  Controller, Get, Post,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { CalculoService } from './calculo.service';
import { SimularCalculoDto } from './calculo.dto';

@ApiTags('calculos')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('calculos')
export class CalculoController {
  constructor(private readonly calculoService: CalculoService) {}

  @Post('simular')
  @ApiOperation({ summary: 'Simular calculo tributario (CBS/IBS/IS - LC 214/2025)' })
  simular(@Body() dto: SimularCalculoDto, @CurrentUser() user: AuthUser) {
    return this.calculoService.simular(dto, user.id);
  }

  @Get('historico/:empresaId')
  @ApiOperation({ summary: 'Historico de calculos de uma empresa' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHistorico(
    @Param('empresaId') empresaId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.calculoService.getHistorico(empresaId, page, limit);
  }

  @Get('projecao/:empresaId')
  @ApiOperation({ summary: 'Projecao multi-ano 2026-2033 (transicao CBS/IBS)' })
  projetar(@Param('empresaId') empresaId: string) {
    return this.calculoService.projetar(empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar calculo por ID' })
  findById(@Param('id') id: string) {
    return this.calculoService.findById(id);
  }
}
