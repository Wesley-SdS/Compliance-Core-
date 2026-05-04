import { Module } from '@nestjs/common';
import { AprovacaoController } from './aprovacao.controller';
import { AprovacaoService } from './aprovacao.service';

@Module({
  controllers: [AprovacaoController],
  providers: [AprovacaoService],
  exports: [AprovacaoService],
})
export class AprovacaoModule {}
