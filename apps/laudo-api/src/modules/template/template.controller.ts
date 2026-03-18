import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BetterAuthGuard } from '@compliancecore/sdk';
import { TemplateService } from './template.service';
import { CreateTemplateDto, UpdateTemplateDto } from './template.dto';

@ApiTags('templates')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  @ApiOperation({ summary: 'Criar template de exame' })
  create(@Body() dto: CreateTemplateDto) {
    return this.templateService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar templates' })
  @ApiQuery({ name: 'laboratorioId', required: false })
  findAll(@Query('laboratorioId') laboratorioId?: string) {
    return this.templateService.findAll(laboratorioId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar template por ID' })
  findById(@Param('id') id: string) {
    return this.templateService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar template' })
  update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templateService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar template' })
  delete(@Param('id') id: string) {
    return this.templateService.delete(id);
  }
}
