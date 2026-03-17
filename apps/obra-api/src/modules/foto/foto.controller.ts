import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { FotoService } from './foto.service';
import { RegistrarFotoDto } from './foto.dto';

@ApiTags('fotos')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller()
export class FotoController {
  constructor(private readonly fotoService: FotoService) {}

  @Post('obras/:id/fotos')
  @ApiOperation({ summary: 'Registrar foto geolocalizada' })
  registrar(
    @Param('id') obraId: string,
    @Body() dto: RegistrarFotoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.fotoService.registrar({ ...dto, obraId }, user.id);
  }

  @Get('obras/:id/fotos')
  @ApiOperation({ summary: 'Listar fotos da obra' })
  findByObra(@Param('id') obraId: string) {
    return this.fotoService.findByObra(obraId);
  }

  @Get('obras/:id/etapas/:etapaId/fotos')
  @ApiOperation({ summary: 'Listar fotos de uma etapa' })
  findByEtapa(@Param('id') obraId: string, @Param('etapaId') etapaId: string) {
    return this.fotoService.findByEtapa(obraId, etapaId);
  }
}
