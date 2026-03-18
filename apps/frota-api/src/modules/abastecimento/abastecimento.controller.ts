import {
  Controller, Get, Post,
  Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { AbastecimentoService } from './abastecimento.service';
import { CreateAbastecimentoDto } from './abastecimento.dto';

@ApiTags('abastecimentos')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('abastecimentos')
export class AbastecimentoController {
  constructor(private readonly abastecimentoService: AbastecimentoService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar novo abastecimento' })
  create(@Body() dto: CreateAbastecimentoDto, @CurrentUser() user: AuthUser) {
    return this.abastecimentoService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os abastecimentos' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.abastecimentoService.findAll(page, limit);
  }
}
