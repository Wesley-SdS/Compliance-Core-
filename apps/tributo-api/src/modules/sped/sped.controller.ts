import {
  Controller, Get, Post, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { SpedService } from './sped.service';
import { UploadSpedDto } from './sped.dto';

@ApiTags('sped')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('sped')
export class SpedController {
  constructor(private readonly spedService: SpedService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload de arquivo SPED' })
  upload(@Body() dto: UploadSpedDto, @CurrentUser() user: AuthUser) {
    return this.spedService.upload(dto, user.id);
  }

  @Get('empresa/:empresaId')
  @ApiOperation({ summary: 'Listar arquivos SPED de uma empresa' })
  findByEmpresa(@Param('empresaId') empresaId: string) {
    return this.spedService.findByEmpresa(empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar arquivo SPED por ID' })
  findById(@Param('id') id: string) {
    return this.spedService.findById(id);
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Validar arquivo SPED' })
  validate(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.spedService.validate(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir arquivo SPED' })
  delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.spedService.delete(id, user.id);
  }
}
