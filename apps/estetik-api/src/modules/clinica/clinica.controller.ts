import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ClerkAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { ClinicaService } from './clinica.service';
import {
  CreateClinicaDto,
  UpdateClinicaDto,
  UploadDocumentDto,
  SubmitChecklistDto,
  PaginationQueryDto,
} from './clinica.dto';

@ApiTags('clinicas')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('clinicas')
export class ClinicaController {
  constructor(private readonly clinicaService: ClinicaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar nova clinica' })
  @ApiResponse({ status: 201, description: 'Clinica criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados invalidos' })
  async create(@Body() dto: CreateClinicaDto, @CurrentUser() user: AuthUser) {
    return this.clinicaService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar clinicas' })
  @ApiResponse({ status: 200, description: 'Lista de clinicas' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.clinicaService.findAll(query.page, query.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes da clinica' })
  @ApiParam({ name: 'id', description: 'ID da clinica' })
  @ApiResponse({ status: 200, description: 'Detalhes da clinica' })
  @ApiResponse({ status: 404, description: 'Clinica nao encontrada' })
  async findOne(@Param('id') id: string) {
    return this.clinicaService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar clinica' })
  @ApiParam({ name: 'id', description: 'ID da clinica' })
  @ApiResponse({ status: 200, description: 'Clinica atualizada' })
  @ApiResponse({ status: 404, description: 'Clinica nao encontrada' })
  async update(@Param('id') id: string, @Body() dto: UpdateClinicaDto, @CurrentUser() user: AuthUser) {
    return this.clinicaService.update(id, dto, user.id);
  }

  @Get(':id/score')
  @ApiOperation({ summary: 'Obter score de compliance da clinica' })
  @ApiParam({ name: 'id', description: 'ID da clinica' })
  @ApiResponse({ status: 200, description: 'Score de compliance' })
  @ApiResponse({ status: 404, description: 'Clinica nao encontrada' })
  async getScore(@Param('id') id: string) {
    const score = await this.clinicaService.getScore(id);
    if (!score) {
      return this.clinicaService.calculateScore(id);
    }
    return score;
  }

  @Post(':id/score/calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recalcular score de compliance' })
  @ApiParam({ name: 'id', description: 'ID da clinica' })
  @ApiResponse({ status: 200, description: 'Score recalculado' })
  @ApiResponse({ status: 404, description: 'Clinica nao encontrada' })
  async calculateScore(@Param('id') id: string) {
    return this.clinicaService.calculateScore(id);
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'Obter trilha de auditoria da clinica' })
  @ApiParam({ name: 'id', description: 'ID da clinica' })
  @ApiResponse({ status: 200, description: 'Eventos de auditoria' })
  async getEvents(
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.clinicaService.getEvents(id, query.page, query.limit);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Listar documentos da clinica' })
  @ApiParam({ name: 'id', description: 'ID da clinica' })
  @ApiResponse({ status: 200, description: 'Lista de documentos' })
  async getDocuments(@Param('id') id: string) {
    return this.clinicaService.getDocuments(id);
  }

  @Post(':id/documents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload de documento' })
  @ApiParam({ name: 'id', description: 'ID da clinica' })
  @ApiResponse({ status: 201, description: 'Documento enviado' })
  @ApiResponse({ status: 404, description: 'Clinica nao encontrada' })
  async uploadDocument(
    @Param('id') id: string,
    @Body() dto: UploadDocumentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.clinicaService.uploadDocument(id, dto, user.id);
  }

  @Get(':id/alerts')
  @ApiOperation({ summary: 'Obter alertas da clinica' })
  @ApiParam({ name: 'id', description: 'ID da clinica' })
  @ApiResponse({ status: 200, description: 'Lista de alertas' })
  async getAlerts(@Param('id') id: string) {
    return this.clinicaService.getAlerts(id);
  }

  @Get(':id/checklist')
  @ApiOperation({ summary: 'Obter ou gerar checklist da clinica' })
  @ApiParam({ name: 'id', description: 'ID da clinica' })
  @ApiResponse({ status: 200, description: 'Checklist da clinica' })
  async getChecklist(@Param('id') id: string) {
    return this.clinicaService.getChecklist(id);
  }

  @Post(':id/checklist')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submeter respostas do checklist' })
  @ApiParam({ name: 'id', description: 'ID da clinica' })
  @ApiResponse({ status: 200, description: 'Checklist submetido' })
  @ApiResponse({ status: 404, description: 'Clinica nao encontrada' })
  async submitChecklist(
    @Param('id') id: string,
    @Body() dto: SubmitChecklistDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.clinicaService.submitChecklist(id, dto, user.id);
  }

  @Post(':id/dossier')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gerar dossie de auditoria' })
  @ApiParam({ name: 'id', description: 'ID da clinica' })
  @ApiResponse({ status: 200, description: 'Dossie gerado' })
  @ApiResponse({ status: 404, description: 'Clinica nao encontrada' })
  async generateDossier(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.clinicaService.generateDossier(id, user.id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Obter timeline da clinica' })
  @ApiParam({ name: 'id', description: 'ID da clinica' })
  @ApiResponse({ status: 200, description: 'Timeline de eventos' })
  async getTimeline(@Param('id') id: string) {
    return this.clinicaService.getTimeline(id);
  }
}
