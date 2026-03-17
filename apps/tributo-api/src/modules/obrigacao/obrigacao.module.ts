import { Module } from '@nestjs/common';
import { ObrigacaoController } from './obrigacao.controller';
import { ObrigacaoService } from './obrigacao.service';

@Module({
  controllers: [ObrigacaoController],
  providers: [ObrigacaoService],
  exports: [ObrigacaoService],
})
export class ObrigacaoModule {}
