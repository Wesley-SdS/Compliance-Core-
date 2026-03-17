import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClerkAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { EtapaService } from './etapa.service';
import { CreateEtapaDto, UpdateEtapaDto } from './etapa.dto';

@ApiTags('etapas')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('etapas')
export class EtapaController {
  constructor(private readonly etapaService: EtapaService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova etapa de construcao' })
  create(@Body() dto: CreateEtapaDto, @CurrentUser() user: AuthUser) {
    return this.etapaService.create(dto, user.id);
  }

  @Get('obra/:obraId')
  @ApiOperation({ summary: 'Listar etapas de uma obra' })
  findByObra(@Param('obraId') obraId: string) {
    return this.etapaService.findByObra(obraId);
  }

  @Get('obra/:obraId/compliance')
  @ApiOperation({ summary: 'Compliance por etapa da obra' })
  getComplianceByEtapa(@Param('obraId') obraId: string) {
    return this.etapaService.getComplianceByEtapa(obraId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar etapa por ID' })
  findById(@Param('id') id: string) {
    return this.etapaService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar etapa' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEtapaDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.etapaService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir etapa' })
  delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.etapaService.delete(id, user.id);
  }
}
