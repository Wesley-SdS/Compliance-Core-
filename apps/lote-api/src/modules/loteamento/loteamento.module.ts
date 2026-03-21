import { Module } from '@nestjs/common';
import { EventStoreModule, ScoreEngineModule, VektusAdapterModule } from '@compliancecore/sdk';
import { LoteamentoController } from './loteamento.controller';
import { LoteamentoService } from './loteamento.service';

@Module({
  imports: [EventStoreModule, ScoreEngineModule, VektusAdapterModule],
  controllers: [LoteamentoController],
  providers: [LoteamentoService],
  exports: [LoteamentoService],
})
export class LoteamentoModule {}
