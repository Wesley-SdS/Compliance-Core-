import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VektusWebhookGuard } from '@compliancecore/sdk';
import { ProcessarOCRCallbackUseCase } from '../obra/use-cases/processar-ocr-callback.use-case';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(
    private readonly processarOCR: ProcessarOCRCallbackUseCase,
  ) {}

  @Post('vektus/file-indexed')
  @UseGuards(VektusWebhookGuard)
  @ApiOperation({ summary: 'Callback do Vektus apos indexacao de arquivo' })
  async onFileIndexed(@Body() payload: any) {
    return this.processarOCR.execute(payload);
  }
}
