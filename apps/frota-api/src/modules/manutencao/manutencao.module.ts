import { Module } from '@nestjs/common';
import { ManutencaoController } from './manutencao.controller';
import { ManutencaoService } from './manutencao.service';

@Module({
  controllers: [ManutencaoController],
  providers: [ManutencaoService],
  exports: [ManutencaoService],
})
export class ManutencaoModule {}
