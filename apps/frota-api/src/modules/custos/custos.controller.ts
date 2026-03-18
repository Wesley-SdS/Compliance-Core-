import {
  Controller, Get, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BetterAuthGuard } from '@compliancecore/sdk';
import { CustosService } from './custos.service';

@ApiTags('custos')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('custos')
export class CustosController {
  constructor(private readonly custosService: CustosService) {}

  @Get()
  @ApiOperation({ summary: 'Custos agregados da frota' })
  @ApiQuery({ name: 'periodo', required: false, enum: ['semana', 'mes', 'trimestre'] })
  @ApiQuery({ name: 'veiculoId', required: false, type: String })
  getCustos(
    @Query('periodo') periodo = 'mes',
    @Query('veiculoId') veiculoId?: string,
  ) {
    return this.custosService.getCustos(periodo, veiculoId);
  }
}
