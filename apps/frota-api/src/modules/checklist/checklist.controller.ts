import {
  Controller, Post, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetterAuthGuard, CurrentUser, AuthUser } from '@compliancecore/sdk';
import { ChecklistService } from './checklist.service';
import { CreateChecklistDto } from './checklist.dto';

@ApiTags('checklists')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('checklists')
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Post()
  @ApiOperation({ summary: 'Submeter checklist pre-viagem' })
  create(@Body() dto: CreateChecklistDto, @CurrentUser() user: AuthUser) {
    return this.checklistService.create(dto, user.id);
  }
}
