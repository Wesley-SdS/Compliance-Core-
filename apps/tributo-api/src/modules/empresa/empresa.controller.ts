import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards, Res, Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiProduces } from '@nestjs/swagger';
import type { Response } from 'express';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto, UpdateEmpresaDto } from './empresa.dto';

@ApiTags('empresas')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('empresas')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar nova empresa cliente' })
  create(@Body() dto: CreateEmpresaDto, @CurrentUser() user: AuthUser) {
    return this.empresaService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as empresas' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'regime', required: false, type: String })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('regime') regime?: string,
  ) {
    return this.empresaService.findAll(page, limit, { search, regime });
  }

  @Get('score')
  @ApiOperation({ summary: 'Score global de compliance (media de todas empresas)' })
  getGlobalScore() {
    return this.empresaService.getGlobalScore();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar empresa por ID' })
  findById(@Param('id') id: string) {
    return this.empresaService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar empresa' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmpresaDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.empresaService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir empresa' })
  delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.empresaService.delete(id, user.id);
  }

  @Get(':id/score')
  @ApiOperation({ summary: 'Calcular score de compliance tributario' })
  calculateScore(@Param('id') id: string) {
    return this.empresaService.calculateScore(id);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Listar documentos da empresa' })
  getDocuments(@Param('id') id: string) {
    return this.empresaService.getDocuments(id);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Upload de documento da empresa' })
  uploadDocument(
    @Param('id') id: string,
    @Body() file: { fileName: string; content: string; category: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.empresaService.uploadDocument(id, file, user.id);
  }

  @Get(':id/alerts')
  @ApiOperation({ summary: 'Listar alertas da empresa' })
  getAlerts(@Param('id') id: string) {
    return this.empresaService.getAlerts(id);
  }

  @Get(':id/checklist')
  @ApiOperation({ summary: 'Obter checklist de compliance da empresa' })
  getChecklist(@Param('id') id: string) {
    return this.empresaService.getChecklist(id);
  }

  @Put(':id/checklist')
  @ApiOperation({ summary: 'Submeter respostas do checklist de compliance' })
  updateChecklist(
    @Param('id') id: string,
    @Body() body: { checklistId: string; responses: { itemId: string; answer: string; notes?: string; evidenceIds?: string[] }[] },
    @CurrentUser() user: AuthUser,
  ) {
    return this.empresaService.updateChecklist(id, body.checklistId, body.responses, user.id);
  }

  @Get(':id/relatorio')
  @ApiOperation({ summary: 'Gerar relatorio PDF de compliance da empresa' })
  @ApiProduces('application/pdf')
  @ApiQuery({ name: 'meses', required: false, type: Number, description: 'Periodo em meses (default: 12)' })
  async getRelatorio(
    @Param('id') id: string,
    @Query('meses') meses = 12,
    @Res() res: Response,
  ) {
    const buffer = await this.empresaService.getRelatorio(id, meses);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="relatorio-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get(':id/dossier')
  @ApiOperation({ summary: 'Gerar dossie completo da empresa (JSON)' })
  getDossier(@Param('id') id: string) {
    return this.empresaService.getDossier(id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Timeline de eventos da empresa' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTimeline(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.empresaService.getTimeline(id, page, limit);
  }
}
