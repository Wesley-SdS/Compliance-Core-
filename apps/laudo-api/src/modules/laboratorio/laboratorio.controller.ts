import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClerkAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { LaboratorioService } from './laboratorio.service';
import { CreateLaboratorioDto, UpdateLaboratorioDto } from './laboratorio.dto';

@ApiTags('laboratorios')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('laboratorios')
export class LaboratorioController {
  constructor(private readonly laboratorioService: LaboratorioService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo laboratorio' })
  create(@Body() dto: CreateLaboratorioDto, @CurrentUser() user: AuthUser) {
    return this.laboratorioService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os laboratorios' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.laboratorioService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar laboratorio por ID' })
  findById(@Param('id') id: string) {
    return this.laboratorioService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar laboratorio' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLaboratorioDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.laboratorioService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir laboratorio' })
  delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.laboratorioService.delete(id, user.id);
  }

  @Get(':id/score')
  @ApiOperation({ summary: 'Calcular score de compliance do laboratorio' })
  calculateScore(@Param('id') id: string) {
    return this.laboratorioService.calculateScore(id);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Listar documentos do laboratorio' })
  getDocuments(@Param('id') id: string) {
    return this.laboratorioService.getDocuments(id);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Upload de documento do laboratorio' })
  uploadDocument(
    @Param('id') id: string,
    @Body() file: { fileName: string; content: string; category: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.laboratorioService.uploadDocument(id, file, user.id);
  }

  @Get(':id/alerts')
  @ApiOperation({ summary: 'Listar alertas do laboratorio' })
  getAlerts(@Param('id') id: string) {
    return this.laboratorioService.getAlerts(id);
  }

  @Get(':id/checklist')
  @ApiOperation({ summary: 'Obter checklist de compliance' })
  getChecklist(@Param('id') id: string) {
    return this.laboratorioService.getChecklist(id);
  }

  @Get(':id/dossier')
  @ApiOperation({ summary: 'Gerar dossie completo do laboratorio' })
  getDossier(@Param('id') id: string) {
    return this.laboratorioService.getDossier(id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Timeline de eventos do laboratorio' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTimeline(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.laboratorioService.getTimeline(id, page, limit);
  }
}
