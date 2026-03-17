import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { LegislacaoService } from './legislacao.service';

@ApiTags('legislacao')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('legislacao')
export class LegislacaoController {
  constructor(private readonly legislacaoService: LegislacaoService) {}

  @Get('feed')
  @ApiOperation({ summary: 'Obter feed de legislacao recente' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Feed de legislacao' })
  async getFeed(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.legislacaoService.getFeed(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de legislacao' })
  @ApiParam({ name: 'id', description: 'ID da legislacao' })
  @ApiResponse({ status: 200, description: 'Detalhes da legislacao' })
  @ApiResponse({ status: 404, description: 'Legislacao nao encontrada' })
  async findOne(@Param('id') id: string) {
    return this.legislacaoService.findOne(id);
  }

  @Post(':id/impacto/:clinicaId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analisar impacto de legislacao em clinica' })
  @ApiParam({ name: 'id', description: 'ID da legislacao' })
  @ApiParam({ name: 'clinicaId', description: 'ID da clinica' })
  @ApiResponse({ status: 200, description: 'Relatorio de impacto' })
  async analyzeImpact(
    @Param('id') id: string,
    @Param('clinicaId') clinicaId: string,
  ) {
    return this.legislacaoService.analyzeImpact(id, clinicaId);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Forcar sincronizacao de fontes legislativas' })
  @ApiResponse({ status: 200, description: 'Sincronizacao iniciada' })
  async forceSync(@CurrentUser() user: AuthUser) {
    return this.legislacaoService.forceSync(user.id);
  }
}
