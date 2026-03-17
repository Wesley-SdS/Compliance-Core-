import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { ObraModule } from '../obra/obra.module';

@Module({
  imports: [ObraModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
