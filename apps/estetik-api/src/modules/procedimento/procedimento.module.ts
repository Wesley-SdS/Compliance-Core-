import { Module } from '@nestjs/common';
import { ProcedimentoController } from './procedimento.controller';
import { ProcedimentoService } from './procedimento.service';

@Module({
  controllers: [ProcedimentoController],
  providers: [ProcedimentoService],
  exports: [ProcedimentoService],
})
export class ProcedimentoModule {}
