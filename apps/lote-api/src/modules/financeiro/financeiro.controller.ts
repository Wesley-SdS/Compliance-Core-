import {
  Controller, Get,
  Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetterAuthGuard } from '@compliancecore/sdk';
import { FinanceiroService } from './financeiro.service';

@ApiTags('financeiro')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller()
export class FinanceiroController {
  constructor(private readonly financeiroService: FinanceiroService) {}

  @Get('loteamentos/:id/financeiro')
  @ApiOperation({ summary: 'Dashboard financeiro do loteamento' })
  getDashboard(@Param('id') id: string) {
    return this.financeiroService.getDashboard(id);
  }
}
