import { Module } from '@nestjs/common';
import { ProcedimentoController } from './procedimento.controller';
import { ProcedimentoService } from './procedimento.service';
import { EventStoreModule } from '@compliancecore/sdk/event-store/event-store.module';

@Module({
  imports: [EventStoreModule],
  controllers: [ProcedimentoController],
  providers: [ProcedimentoService],
  exports: [ProcedimentoService],
})
export class ProcedimentoModule {}
