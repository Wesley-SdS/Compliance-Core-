import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PortalService } from './portal.service';

@ApiTags('portal')
@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Acessar laudo por token (publico)' })
  findByToken(@Param('token') token: string) {
    return this.portalService.findByToken(token);
  }
}
