import { Module } from '@nestjs/common';
import { LegislacaoController } from './legislacao.controller';
import { LegislacaoService } from './legislacao.service';
import { LegislacaoScrapersService } from './legislacao-scrapers';

@Module({
  controllers: [LegislacaoController],
  providers: [LegislacaoService, LegislacaoScrapersService],
  exports: [LegislacaoService],
})
export class LegislacaoModule {}
