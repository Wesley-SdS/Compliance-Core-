import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { ProcedimentoService } from './procedimento.service';
import { CreateProcedimentoDto, UpdateProcedimentoDto } from './procedimento.dto';

@ApiTags('procedimentos')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('procedimentos')
export class ProcedimentoController {
  constructor(private readonly procedimentoService: ProcedimentoService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo tipo de procedimento' })
  @ApiResponse({ status: 201, description: 'Procedimento criado' })
  @ApiResponse({ status: 400, description: 'Dados invalidos' })
  async create(@Body() dto: CreateProcedimentoDto, @CurrentUser() user: AuthUser) {
    return this.procedimentoService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tipos de procedimentos' })
  @ApiResponse({ status: 200, description: 'Lista de procedimentos' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.procedimentoService.findAll(page || 1, limit || 20);
  }

  @Get('tipo/:tipo')
  @ApiOperation({ summary: 'Listar procedimentos por tipo' })
  @ApiParam({
    name: 'tipo',
    description: 'Tipo do procedimento (ex: botox, preenchimento, laser)',
  })
  @ApiResponse({ status: 200, description: 'Procedimentos do tipo' })
  async findByTipo(@Param('tipo') tipo: string) {
    return this.procedimentoService.findByTipo(tipo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes do procedimento' })
  @ApiParam({ name: 'id', description: 'ID do procedimento' })
  @ApiResponse({ status: 200, description: 'Detalhes do procedimento' })
  @ApiResponse({ status: 404, description: 'Procedimento nao encontrado' })
  async findOne(@Param('id') id: string) {
    return this.procedimentoService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar procedimento' })
  @ApiParam({ name: 'id', description: 'ID do procedimento' })
  @ApiResponse({ status: 200, description: 'Procedimento atualizado' })
  @ApiResponse({ status: 404, description: 'Procedimento nao encontrado' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProcedimentoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.procedimentoService.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover procedimento' })
  @ApiParam({ name: 'id', description: 'ID do procedimento' })
  @ApiResponse({ status: 204, description: 'Procedimento removido' })
  @ApiResponse({ status: 404, description: 'Procedimento nao encontrado' })
  async delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.procedimentoService.delete(id, user.id);
  }
}
