import {
  Controller, Get, Post,
  Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { ManutencaoService } from './manutencao.service';
import { CreateManutencaoDto } from './manutencao.dto';

@ApiTags('manutencoes')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('manutencoes')
export class ManutencaoController {
  constructor(private readonly manutencaoService: ManutencaoService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar nova manutencao' })
  create(@Body() dto: CreateManutencaoDto, @CurrentUser() user: AuthUser) {
    return this.manutencaoService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as manutencoes' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.manutencaoService.findAll(page, limit);
  }

  @Get('alertas')
  @ApiOperation({ summary: 'Listar manutencoes vencidas e proximas' })
  getAlertas() {
    return this.manutencaoService.getAlertas();
  }
}
