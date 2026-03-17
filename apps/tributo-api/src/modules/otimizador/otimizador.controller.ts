import {
  Controller, Post,
  Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { OtimizadorService } from './otimizador.service';

@ApiTags('otimizador')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('empresas')
export class OtimizadorController {
  constructor(private readonly otimizadorService: OtimizadorService) {}

  @Post(':id/otimizar')
  @ApiOperation({ summary: 'Executar otimizacao de mix tributario' })
  otimizar(@Param('id') empresaId: string, @CurrentUser() user: AuthUser) {
    return this.otimizadorService.otimizar(empresaId, user.id);
  }
}
