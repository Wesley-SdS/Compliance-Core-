import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { LoteamentoService } from './loteamento.service';
import { CreateLoteamentoDto, UpdateLoteamentoDto } from './loteamento.dto';

@ApiTags('loteamentos')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('loteamentos')
export class LoteamentoController {
  constructor(private readonly loteamentoService: LoteamentoService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo loteamento' })
  create(@Body() dto: CreateLoteamentoDto, @CurrentUser() user: AuthUser) {
    return this.loteamentoService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os loteamentos' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.loteamentoService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar loteamento por ID' })
  findById(@Param('id') id: string) {
    return this.loteamentoService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar loteamento' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLoteamentoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.loteamentoService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir loteamento' })
  delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.loteamentoService.delete(id, user.id);
  }

  @Get(':id/score')
  @ApiOperation({ summary: 'Calcular score de compliance do loteamento' })
  calculateScore(@Param('id') id: string) {
    return this.loteamentoService.calculateScore(id);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Listar documentos do loteamento' })
  getDocuments(@Param('id') id: string) {
    return this.loteamentoService.getDocuments(id);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Upload de documento do loteamento' })
  uploadDocument(
    @Param('id') id: string,
    @Body() file: { fileName: string; content: string; category: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.loteamentoService.uploadDocument(id, file, user.id);
  }

  @Get(':id/alerts')
  @ApiOperation({ summary: 'Listar alertas do loteamento' })
  getAlerts(@Param('id') id: string) {
    return this.loteamentoService.getAlerts(id);
  }

  @Get(':id/checklist')
  @ApiOperation({ summary: 'Obter checklist de compliance' })
  getChecklist(@Param('id') id: string) {
    return this.loteamentoService.getChecklist(id);
  }

  @Get(':id/dossier')
  @ApiOperation({ summary: 'Gerar dossie completo do loteamento' })
  getDossier(@Param('id') id: string) {
    return this.loteamentoService.getDossier(id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Timeline de eventos do loteamento' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTimeline(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.loteamentoService.getTimeline(id, page, limit);
  }
}
