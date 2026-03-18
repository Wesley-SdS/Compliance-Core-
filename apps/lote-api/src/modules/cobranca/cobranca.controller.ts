import {
  Controller, Get, Patch, Post,
  Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { CobrancaService } from './cobranca.service';
import { UpdateReguaDto, ExecutarEtapaDto } from './cobranca.dto';

@ApiTags('cobranca')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('cobranca')
export class CobrancaController {
  constructor(private readonly cobrancaService: CobrancaService) {}

  @Get('regua')
  @ApiOperation({ summary: 'Obter regua de cobranca' })
  getRegua() {
    return this.cobrancaService.getRegua();
  }

  @Patch('regua')
  @ApiOperation({ summary: 'Atualizar regua de cobranca' })
  updateRegua(@Body() dto: UpdateReguaDto, @CurrentUser() user: AuthUser) {
    return this.cobrancaService.updateRegua(dto, user.id);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard de cobranca' })
  getDashboard() {
    return this.cobrancaService.getDashboard();
  }

  @Post('executar')
  @ApiOperation({ summary: 'Executar etapa de cobranca para contrato' })
  executarEtapa(@Body() dto: ExecutarEtapaDto, @CurrentUser() user: AuthUser) {
    return this.cobrancaService.executarEtapa(dto, user.id);
  }
}
