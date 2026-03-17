import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { EquipamentoService } from './equipamento.service';
import { CreateEquipamentoDto, UpdateEquipamentoDto, RegistrarCalibracaoDto } from './equipamento.dto';

@ApiTags('equipamentos')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('equipamentos')
export class EquipamentoController {
  constructor(private readonly equipamentoService: EquipamentoService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo equipamento' })
  create(@Body() dto: CreateEquipamentoDto, @CurrentUser() user: AuthUser) {
    return this.equipamentoService.create(dto, user.id);
  }

  @Get('laboratorio/:laboratorioId')
  @ApiOperation({ summary: 'Listar equipamentos de um laboratorio' })
  findByLaboratorio(@Param('laboratorioId') laboratorioId: string) {
    return this.equipamentoService.findByLaboratorio(laboratorioId);
  }

  @Get('laboratorio/:laboratorioId/vencidos')
  @ApiOperation({ summary: 'Listar equipamentos com calibracao vencida' })
  getVencidos(@Param('laboratorioId') laboratorioId: string) {
    return this.equipamentoService.getVencidos(laboratorioId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar equipamento por ID' })
  findById(@Param('id') id: string) {
    return this.equipamentoService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar equipamento' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEquipamentoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.equipamentoService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir equipamento' })
  delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.equipamentoService.delete(id, user.id);
  }

  @Post(':id/calibracao')
  @ApiOperation({ summary: 'Registrar calibracao do equipamento' })
  registrarCalibracao(
    @Param('id') id: string,
    @Body() dto: RegistrarCalibracaoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.equipamentoService.registrarCalibracao(id, dto, user.id);
  }

  @Get(':id/calibracoes')
  @ApiOperation({ summary: 'Historico de calibracoes do equipamento' })
  getHistoricoCalibracao(@Param('id') id: string) {
    return this.equipamentoService.getHistoricoCalibracao(id);
  }
}
