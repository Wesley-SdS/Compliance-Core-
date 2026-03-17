import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { MaterialService } from './material.service';
import { CreateMaterialDto, UpdateMaterialDto } from './material.dto';
import { TransferirMaterialDto } from '../obra/obra.dto';

@ApiTags('materiais')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('materiais')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar novo material' })
  create(@Body() dto: CreateMaterialDto, @CurrentUser() user: AuthUser) {
    return this.materialService.create(dto, user.id);
  }

  @Get('obra/:obraId')
  @ApiOperation({ summary: 'Listar materiais de uma obra' })
  findByObra(@Param('obraId') obraId: string) {
    return this.materialService.findByObra(obraId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar materiais via Vektus (OCR de notas fiscais)' })
  search(@Query('q') query: string) {
    return this.materialService.searchMaterial(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar material por ID' })
  findById(@Param('id') id: string) {
    return this.materialService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar material' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.materialService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir material' })
  delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.materialService.delete(id, user.id);
  }

  @Post(':id/ocr')
  @ApiOperation({ summary: 'OCR de nota fiscal via Vektus' })
  ocrNotaFiscal(
    @Param('id') id: string,
    @Body() body: { content: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.materialService.ocrNotaFiscal(id, body.content, user.id);
  }

  @Post('transferir')
  @ApiOperation({ summary: 'Transferir material entre obras' })
  transferir(
    @Body() dto: TransferirMaterialDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.materialService.transferir(dto, user.id);
  }
}
