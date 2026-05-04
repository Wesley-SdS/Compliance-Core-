import { Module } from '@nestjs/common';
import { AbastecimentoController } from './abastecimento.controller';
import { AbastecimentoService } from './abastecimento.service';

@Module({
  controllers: [AbastecimentoController],
  providers: [AbastecimentoService],
  exports: [AbastecimentoService],
})
export class AbastecimentoModule {}
