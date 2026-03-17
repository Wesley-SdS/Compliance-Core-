import { Module } from '@nestjs/common';
import { LegislacaoController } from './legislacao.controller';
import { LegislacaoService } from './legislacao.service';
import { AnvisaScraper } from '../../scrapers/anvisa.scraper';
import { DOUScraper } from '../../scrapers/dou.scraper';

@Module({
  controllers: [LegislacaoController],
  providers: [LegislacaoService, AnvisaScraper, DOUScraper],
  exports: [LegislacaoService, AnvisaScraper, DOUScraper],
})
export class LegislacaoModule {}
