import {
  Controller,
  Get,
  Post,
  Put,
  Body,
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
import { PopService } from './pop.service';
import { GeneratePopDto, ApprovePopDto } from './pop.dto';

@ApiTags('pops')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('pops')
export class PopController {
  constructor(private readonly popService: PopService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Gerar POP via Vektus AI (Skills L3)',
    description:
      'Gera um Procedimento Operacional Padrao automaticamente usando IA, com base no tipo de procedimento estetico.',
  })
  @ApiResponse({ status: 201, description: 'POP gerado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados invalidos' })
  async generate(@Body() dto: GeneratePopDto, @CurrentUser() user: AuthUser) {
    return this.popService.generate(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar POPs' })
  @ApiResponse({ status: 200, description: 'Lista de POPs' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.popService.findAll(page || 1, limit || 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes do POP' })
  @ApiParam({ name: 'id', description: 'ID do POP' })
  @ApiResponse({ status: 200, description: 'Detalhes do POP' })
  @ApiResponse({ status: 404, description: 'POP nao encontrado' })
  async findOne(@Param('id') id: string) {
    return this.popService.findOne(id);
  }

  @Put(':id/approve')
  @ApiOperation({
    summary: 'Aprovar POP',
    description:
      'Aprova um POP e marca versoes anteriores do mesmo procedimento como obsoletas.',
  })
  @ApiParam({ name: 'id', description: 'ID do POP' })
  @ApiResponse({ status: 200, description: 'POP aprovado' })
  @ApiResponse({ status: 404, description: 'POP nao encontrado' })
  async approve(@Param('id') id: string, @Body() dto: ApprovePopDto, @CurrentUser() user: AuthUser) {
    return this.popService.approve(id, dto, user.id);
  }
}
