import {
  Controller, Get, Patch, Post,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { InfraestruturaService } from './infraestrutura.service';
import { UpdateInfraestruturaDto, UploadEvidenciaDto } from './infraestrutura.dto';

@ApiTags('infraestrutura')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller()
export class InfraestruturaController {
  constructor(private readonly infraestruturaService: InfraestruturaService) {}

  @Get('loteamentos/:id/infraestrutura')
  @ApiOperation({ summary: 'Obter infraestrutura do loteamento' })
  getByLoteamento(@Param('id') id: string) {
    return this.infraestruturaService.getByLoteamento(id);
  }

  @Patch('loteamentos/:id/infraestrutura')
  @ApiOperation({ summary: 'Atualizar item de infraestrutura' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInfraestruturaDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.infraestruturaService.update(id, dto, user.id);
  }

  @Post('loteamentos/:id/infraestrutura/evidencia')
  @ApiOperation({ summary: 'Upload de evidencia de infraestrutura' })
  uploadEvidencia(
    @Param('id') id: string,
    @Body() dto: UploadEvidenciaDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.infraestruturaService.uploadEvidencia(id, dto, user.id);
  }
}
