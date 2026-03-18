import {
  Controller, Get, Post, Patch,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { AprovacaoService } from './aprovacao.service';
import { CreateAprovacaoDto, UpdateAprovacaoDto } from './aprovacao.dto';

@ApiTags('aprovacoes')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller()
export class AprovacaoController {
  constructor(private readonly aprovacaoService: AprovacaoService) {}

  @Get('loteamentos/:id/aprovacoes')
  @ApiOperation({ summary: 'Listar aprovacoes do loteamento' })
  getByLoteamento(@Param('id') id: string) {
    return this.aprovacaoService.getByLoteamento(id);
  }

  @Post('aprovacoes')
  @ApiOperation({ summary: 'Registrar nova aprovacao' })
  create(@Body() dto: CreateAprovacaoDto, @CurrentUser() user: AuthUser) {
    return this.aprovacaoService.create(dto, user.id);
  }

  @Patch('aprovacoes/:id')
  @ApiOperation({ summary: 'Atualizar aprovacao' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAprovacaoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.aprovacaoService.update(id, dto, user.id);
  }
}
