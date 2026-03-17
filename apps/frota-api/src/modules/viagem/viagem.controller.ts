import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { ViagemService } from './viagem.service';
import { CreateViagemDto, UpdateViagemDto } from './viagem.dto';

@ApiTags('viagens')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('viagens')
export class ViagemController {
  constructor(private readonly viagemService: ViagemService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar nova viagem' })
  create(@Body() dto: CreateViagemDto, @CurrentUser() user: AuthUser) {
    return this.viagemService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as viagens' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.viagemService.findAll(page, limit);
  }

  @Get('em-andamento')
  @ApiOperation({ summary: 'Listar viagens em andamento' })
  getEmAndamento() {
    return this.viagemService.getEmAndamento();
  }

  @Get('sem-ciot')
  @ApiOperation({ summary: 'Listar viagens sem CIOT' })
  getSemCiot() {
    return this.viagemService.getSemCiot();
  }

  @Get('veiculo/:veiculoId')
  @ApiOperation({ summary: 'Listar viagens de um veiculo' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByVeiculo(
    @Param('veiculoId') veiculoId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.viagemService.findByVeiculo(veiculoId, page, limit);
  }

  @Get('motorista/:motoristaId')
  @ApiOperation({ summary: 'Listar viagens de um motorista' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByMotorista(
    @Param('motoristaId') motoristaId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.viagemService.findByMotorista(motoristaId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar viagem por ID' })
  findById(@Param('id') id: string) {
    return this.viagemService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar viagem' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateViagemDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.viagemService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir viagem' })
  delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.viagemService.delete(id, user.id);
  }
}
