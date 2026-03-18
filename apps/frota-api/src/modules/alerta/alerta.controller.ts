import {
  Controller, Get, Post, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { AlertaService } from './alerta.service';

@ApiTags('alertas')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller()
export class AlertaController {
  constructor(private readonly alertaService: AlertaService) {}

  @Post('alertas/:id/acknowledge')
  @ApiOperation({ summary: 'Marcar alerta como reconhecido' })
  acknowledge(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.alertaService.acknowledge(id, user.id);
  }

  @Get('documentos/vencimentos')
  @ApiOperation({ summary: 'Listar documentos com vencimento nos proximos 30 dias' })
  getDocumentosVencimentos() {
    return this.alertaService.getDocumentosVencimentos();
  }
}
