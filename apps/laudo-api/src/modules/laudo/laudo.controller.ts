import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClerkAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { LaudoService } from './laudo.service';
import { CreateLaudoDto, UpdateLaudoDto } from './laudo.dto';

@ApiTags('laudos')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('laudos')
export class LaudoController {
  constructor(private readonly laudoService: LaudoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo laudo' })
  create(@Body() dto: CreateLaudoDto, @CurrentUser() user: AuthUser) {
    return this.laudoService.create(dto, user.id);
  }

  @Get('laboratorio/:laboratorioId')
  @ApiOperation({ summary: 'Listar laudos de um laboratorio' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByLaboratorio(
    @Param('laboratorioId') laboratorioId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.laudoService.findByLaboratorio(laboratorioId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar laudo por ID' })
  findById(@Param('id') id: string) {
    return this.laudoService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar laudo' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLaudoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.laudoService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir laudo' })
  delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.laudoService.delete(id, user.id);
  }

  @Post(':id/ai-review')
  @ApiOperation({ summary: 'Revisao AI do laudo via Vektus' })
  aiReview(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.laudoService.aiReview(id, user.id);
  }
}
