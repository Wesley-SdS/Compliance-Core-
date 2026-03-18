import {
  Controller, Post,
  Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VektusWebhookGuard } from '@compliancecore/sdk';
import { WebhookService, VektusWebhookPayload } from './webhook.service';

@ApiTags('webhooks')
@Controller('api/webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('vektus')
  @UseGuards(VektusWebhookGuard)
  @ApiOperation({ summary: 'Receber callback do Vektus' })
  handleVektus(@Body() payload: VektusWebhookPayload) {
    return this.webhookService.handleVektusEvent(payload);
  }
}
