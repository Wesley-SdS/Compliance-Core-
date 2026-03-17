import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { ObraService } from './obra.service';
import { CreateObraDto, UpdateObraDto, UploadNotaFiscalDto, SubmitChecklistDto, UploadDocumentoDto } from './obra.dto';

@ApiTags('obras')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('obras')
export class ObraController {
  constructor(private readonly obraService: ObraService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova obra' })
  create(@Body() dto: CreateObraDto, @CurrentUser() user: AuthUser) {
    return this.obraService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as obras' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.obraService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar obra por ID' })
  findById(@Param('id') id: string) {
    return this.obraService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar obra' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateObraDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.obraService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir obra' })
  delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.obraService.delete(id, user.id);
  }

  @Get(':id/score')
  @ApiOperation({ summary: 'Calcular score de compliance da obra' })
  calculateScore(@Param('id') id: string) {
    return this.obraService.calculateScore(id);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Listar documentos da obra' })
  getDocuments(@Param('id') id: string) {
    return this.obraService.getDocuments(id);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Fazer upload de documento da obra' })
  uploadDocument(
    @Param('id') id: string,
    @Body() file: { fileName: string; content: string; category: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.obraService.uploadDocument(id, file, user.id);
  }

  @Get(':id/alerts')
  @ApiOperation({ summary: 'Listar alertas da obra' })
  getAlerts(@Param('id') id: string) {
    return this.obraService.getAlerts(id);
  }

  @Get(':id/checklist')
  @ApiOperation({ summary: 'Obter checklist de compliance da obra' })
  getChecklist(@Param('id') id: string) {
    return this.obraService.getChecklist(id);
  }

  @Get(':id/dossier')
  @ApiOperation({ summary: 'Gerar dossie completo da obra' })
  getDossier(@Param('id') id: string) {
    return this.obraService.getDossier(id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Obter timeline de eventos da obra' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTimeline(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.obraService.getTimeline(id, page, limit);
  }

  @Get(':id/score/history')
  @ApiOperation({ summary: 'Historico de score de compliance' })
  @ApiQuery({ name: 'months', required: false, type: Number })
  getScoreHistory(@Param('id') id: string, @Query('months') months: number = 6) {
    return this.obraService.getScoreHistory(id, months);
  }

  @Post(':id/notas')
  @ApiOperation({ summary: 'Upload de nota fiscal para OCR' })
  uploadNota(
    @Param('id') id: string,
    @Body() dto: UploadNotaFiscalDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.obraService.uploadNota(id, dto, user.id);
  }

  @Get(':id/notas')
  @ApiOperation({ summary: 'Listar notas fiscais da obra' })
  getNotas(@Param('id') id: string) {
    return this.obraService.getNotas(id);
  }

  @Post(':id/etapas/:etapaId/checklist')
  @ApiOperation({ summary: 'Submeter checklist de etapa' })
  submitEtapaChecklist(
    @Param('id') obraId: string,
    @Param('etapaId') etapaId: string,
    @Body() dto: SubmitChecklistDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.obraService.submitEtapaChecklist(obraId, etapaId, dto, user.id);
  }

  @Get(':id/materiais')
  @ApiOperation({ summary: 'Listar materiais da obra' })
  getMateriais(@Param('id') id: string) {
    return this.obraService.getMateriais(id);
  }

  @Get(':id/relatorio')
  @ApiOperation({ summary: 'Gerar relatorio para proprietario' })
  getRelatorio(@Param('id') id: string) {
    return this.obraService.getRelatorio(id);
  }
}
