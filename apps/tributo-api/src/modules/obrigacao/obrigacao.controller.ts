import {
  Controller, Get, Post, Put,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { ObrigacaoService } from './obrigacao.service';
import { CreateObrigacaoDto, UpdateObrigacaoStatusDto } from './obrigacao.dto';

@ApiTags('obrigacoes')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('obrigacoes')
export class ObrigacaoController {
  constructor(private readonly obrigacaoService: ObrigacaoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar obrigacao acessoria' })
  create(@Body() dto: CreateObrigacaoDto, @CurrentUser() user: AuthUser) {
    return this.obrigacaoService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar obrigacoes acessorias' })
  @ApiQuery({ name: 'empresaId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('empresaId') empresaId?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.obrigacaoService.findAll({ empresaId, status }, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar obrigacao por ID' })
  findById(@Param('id') id: string) {
    return this.obrigacaoService.findById(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Atualizar status da obrigacao' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateObrigacaoStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.obrigacaoService.updateStatus(id, dto, user.id);
  }
}
