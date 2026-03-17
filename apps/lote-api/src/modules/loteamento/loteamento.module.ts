import { Module } from '@nestjs/common';
import { EventStoreModule } from '@compliancecore/sdk/event-store/event-store.module';
import { ScoreEngineModule } from '@compliancecore/sdk/score-engine/score-engine.module';
import { VektusAdapterModule } from '@compliancecore/sdk/vektus/vektus-adapter.module';
import { LoteamentoController } from './loteamento.controller';
import { LoteamentoService } from './loteamento.service';

@Module({
  imports: [EventStoreModule, ScoreEngineModule, VektusAdapterModule],
  controllers: [LoteamentoController],
  providers: [LoteamentoService],
  exports: [LoteamentoService],
})
export class LoteamentoModule {}
