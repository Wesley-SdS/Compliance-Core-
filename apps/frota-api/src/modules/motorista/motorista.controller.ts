import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClerkAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { MotoristaService } from './motorista.service';
import { CreateMotoristaDto, UpdateMotoristaDto, RegistrarDescansoDto } from './motorista.dto';

@ApiTags('motoristas')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('motoristas')
export class MotoristaController {
  constructor(private readonly motoristaService: MotoristaService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo motorista' })
  create(@Body() dto: CreateMotoristaDto, @CurrentUser() user: AuthUser) {
    return this.motoristaService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os motoristas' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.motoristaService.findAll(page, limit);
  }

  @Get('cnh-vencendo')
  @ApiOperation({ summary: 'Listar motoristas com CNH proxima do vencimento' })
  @ApiQuery({ name: 'dias', required: false, type: Number })
  getCnhVencendo(@Query('dias') dias = 30) {
    return this.motoristaService.getCnhVencendo(dias);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar motorista por ID' })
  findById(@Param('id') id: string) {
    return this.motoristaService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar motorista' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMotoristaDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.motoristaService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir motorista' })
  delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.motoristaService.delete(id, user.id);
  }

  @Post('descanso')
  @ApiOperation({ summary: 'Registrar periodo de descanso (Lei do Descanso)' })
  registrarDescanso(@Body() dto: RegistrarDescansoDto, @CurrentUser() user: AuthUser) {
    return this.motoristaService.registrarDescanso(dto, user.id);
  }

  @Get(':id/descansos')
  @ApiOperation({ summary: 'Historico de descansos do motorista' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getDescansos(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.motoristaService.getDescansos(id, page, limit);
  }
}
