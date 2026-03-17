import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.empresaService.findAll(page, limit);
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

  @Get(':id/dossier')
  @ApiOperation({ summary: 'Gerar dossie completo da empresa' })
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
