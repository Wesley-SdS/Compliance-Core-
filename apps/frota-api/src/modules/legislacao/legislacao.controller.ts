import {
  Controller, Get, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetterAuthGuard } from '@compliancecore/sdk';
import { LegislacaoService } from './legislacao.service';

@ApiTags('legislacao')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('legislacao')
export class LegislacaoController {
  constructor(private readonly legislacaoService: LegislacaoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar atualizacoes regulatorias' })
  findAll() {
    return this.legislacaoService.findAll();
  }
}
