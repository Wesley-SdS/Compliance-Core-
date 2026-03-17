import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScraperProcessor } from './scraper.processor';
import { AlertProcessor } from './alert.processor';
import { AnvisaScraper } from '../../scrapers/anvisa.scraper';
import { DOUScraper } from '../../scrapers/dou.scraper';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'scraper' },
      { name: 'alerts' },
    ),
  ],
  providers: [
    ScraperProcessor,
    AlertProcessor,
    AnvisaScraper,
    DOUScraper,
  ],
})
export class JobsModule {}
