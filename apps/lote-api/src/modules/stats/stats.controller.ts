import {
  Controller, Get, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetterAuthGuard } from '@compliancecore/sdk';
import { StatsService } from './stats.service';

@ApiTags('stats')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('lote')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('score')
  @ApiOperation({ summary: 'Score global medio de compliance' })
  getGlobalScore() {
    return this.statsService.getGlobalScore();
  }

  @Get('score/history')
  @ApiOperation({ summary: 'Historico de score dos ultimos 6 meses' })
  getScoreHistory() {
    return this.statsService.getScoreHistory();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatisticas globais de lotes e contratos' })
  getStats() {
    return this.statsService.getStats();
  }
}
