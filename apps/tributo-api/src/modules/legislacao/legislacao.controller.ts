import {
  Controller, Get, Post,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { LegislacaoService } from './legislacao.service';
import { LegislacaoScrapersService } from './legislacao-scrapers';
import { CreateLegislacaoDto } from './legislacao.dto';

@ApiTags('legislacao')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('legislacao')
export class LegislacaoController {
  constructor(
    private readonly legislacaoService: LegislacaoService,
    private readonly scrapers: LegislacaoScrapersService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar nova legislacao' })
  create(@Body() dto: CreateLegislacaoDto, @CurrentUser() user: AuthUser) {
    return this.legislacaoService.create(dto, user.id);
  }

  @Post('check')
  @ApiOperation({ summary: 'Verificar novas legislacoes nas fontes registradas' })
  checkNow() {
    return this.scrapers.checkNow();
  }

  @Post(':id/impacto/:empresaId')
  @ApiOperation({ summary: 'Analisar impacto de legislacao em uma empresa' })
  analyzeImpact(
    @Param('id') id: string,
    @Param('empresaId') empresaId: string,
  ) {
    return this.scrapers.analyzeImpact(id, empresaId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar legislacoes tributarias' })
  @ApiQuery({ name: 'impacto', required: false, enum: ['ALTO', 'MEDIO', 'BAIXO'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('impacto') impacto?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.legislacaoService.findAll({ impacto }, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar legislacao por ID' })
  findById(@Param('id') id: string) {
    return this.legislacaoService.findById(id);
  }
}
