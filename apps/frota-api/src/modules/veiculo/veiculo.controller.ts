import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { VeiculoService } from './veiculo.service';
import { CreateVeiculoDto, UpdateVeiculoDto } from './veiculo.dto';

@ApiTags('veiculos')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('veiculos')
export class VeiculoController {
  constructor(private readonly veiculoService: VeiculoService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo veiculo' })
  create(@Body() dto: CreateVeiculoDto, @CurrentUser() user: AuthUser) {
    return this.veiculoService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os veiculos' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.veiculoService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar veiculo por ID' })
  findById(@Param('id') id: string) {
    return this.veiculoService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar veiculo' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVeiculoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.veiculoService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir veiculo' })
  delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.veiculoService.delete(id, user.id);
  }

  @Get(':id/score')
  @ApiOperation({ summary: 'Calcular score de compliance do veiculo' })
  calculateScore(@Param('id') id: string) {
    return this.veiculoService.calculateScore(id);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Listar documentos do veiculo' })
  getDocuments(@Param('id') id: string) {
    return this.veiculoService.getDocuments(id);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Upload de documento do veiculo' })
  uploadDocument(
    @Param('id') id: string,
    @Body() file: { fileName: string; content: string; category: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.veiculoService.uploadDocument(id, file, user.id);
  }

  @Get(':id/alerts')
  @ApiOperation({ summary: 'Listar alertas do veiculo' })
  getAlerts(@Param('id') id: string) {
    return this.veiculoService.getAlerts(id);
  }

  @Get(':id/checklist')
  @ApiOperation({ summary: 'Obter checklist de compliance' })
  getChecklist(@Param('id') id: string) {
    return this.veiculoService.getChecklist(id);
  }

  @Get(':id/dossier')
  @ApiOperation({ summary: 'Gerar dossie completo do veiculo' })
  getDossier(@Param('id') id: string) {
    return this.veiculoService.getDossier(id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Timeline de eventos do veiculo' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTimeline(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.veiculoService.getTimeline(id, page, limit);
  }
}
