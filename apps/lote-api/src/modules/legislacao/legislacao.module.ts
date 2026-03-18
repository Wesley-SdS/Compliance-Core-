import { Module } from '@nestjs/common';
import { LegislacaoController } from './legislacao.controller';
import { LegislacaoService } from './legislacao.service';

@Module({
  controllers: [LegislacaoController],
  providers: [LegislacaoService],
})
export class LegislacaoModule {}
