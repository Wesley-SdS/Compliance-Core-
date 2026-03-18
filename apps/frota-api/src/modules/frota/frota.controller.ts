import {
  Controller, Get, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetterAuthGuard } from '@compliancecore/sdk';
import { FrotaService } from './frota.service';

@ApiTags('frota')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('frota')
export class FrotaController {
  constructor(private readonly frotaService: FrotaService) {}

  @Get('score')
  @ApiOperation({ summary: 'Score medio de compliance da frota' })
  getScore() {
    return this.frotaService.getScore();
  }

  @Get('stats')
  @ApiOperation({ summary: 'KPIs e estatisticas da frota' })
  getStats() {
    return this.frotaService.getStats();
  }

  @Get('score/history')
  @ApiOperation({ summary: 'Historico de score da frota (ultimos 6 meses)' })
  getScoreHistory() {
    return this.frotaService.getScoreHistory();
  }
}
