import {
  Controller, Post, Body, Headers,
  HttpCode, HttpStatus, UnauthorizedException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import * as crypto from 'crypto';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('vektus/file-indexed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook callback do Vektus OCR' })
  async handleVektusOcr(
    @Body() body: { fileId: string; ocrData: Record<string, any> },
    @Headers('x-vektus-signature') signature: string,
  ) {
    if (!signature) {
      throw new UnauthorizedException('Missing x-vektus-signature header');
    }

    const secret = process.env.VEKTUS_WEBHOOK_SECRET || '';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (!crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    )) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    if (!body.fileId || !body.ocrData) {
      throw new BadRequestException('fileId and ocrData are required');
    }

    return this.webhookService.processOcrResult(body.fileId, body.ocrData);
  }
}
