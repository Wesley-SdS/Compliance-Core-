import { Module } from '@nestjs/common';
import { EventStoreModule } from '@compliancecore/sdk/event-store/event-store.module';
import { ScoreEngineModule } from '@compliancecore/sdk/score-engine/score-engine.module';
import { VektusAdapterModule } from '@compliancecore/sdk/vektus/vektus-adapter.module';
import { LaboratorioController } from './laboratorio.controller';
import { LaboratorioService } from './laboratorio.service';

@Module({
  imports: [EventStoreModule, ScoreEngineModule, VektusAdapterModule],
  controllers: [LaboratorioController],
  providers: [LaboratorioService],
  exports: [LaboratorioService],
})
export class LaboratorioModule {}
