import {
  Controller, Get, Post,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { DecisaoService } from './decisao.service';
import { CreateDecisaoDto } from './decisao.dto';

@ApiTags('decisoes')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('empresas')
export class DecisaoController {
  constructor(private readonly decisaoService: DecisaoService) {}

  @Get(':id/decisoes')
  @ApiOperation({ summary: 'Listar decisoes fiscais de uma empresa' })
  findByEmpresa(@Param('id') empresaId: string) {
    return this.decisaoService.findByEmpresa(empresaId);
  }

  @Post(':id/decisoes')
  @ApiOperation({ summary: 'Registrar decisao fiscal com assinatura digital' })
  create(
    @Param('id') empresaId: string,
    @Body() dto: CreateDecisaoDto,
    @CurrentUser() user: AuthUser,
  ) {
    dto.empresaId = empresaId;
    return this.decisaoService.create(dto, user.id);
  }
}
