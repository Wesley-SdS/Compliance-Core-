import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScraperProcessor } from './scraper.processor';
import { AlertProcessor } from './alert.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'obra-scraper' },
      { name: 'obra-alerts' },
    ),
  ],
  providers: [ScraperProcessor, AlertProcessor],
})
export class JobsModule {}
