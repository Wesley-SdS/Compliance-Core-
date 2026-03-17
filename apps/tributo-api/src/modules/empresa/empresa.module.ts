import { Module } from '@nestjs/common';
import { EventStoreModule } from '@compliancecore/sdk/event-store/event-store.module';
import { ScoreEngineModule } from '@compliancecore/sdk/score-engine/score-engine.module';
import { VektusAdapterModule } from '@compliancecore/sdk/vektus/vektus-adapter.module';
import { EmpresaController } from './empresa.controller';
import { EmpresaService } from './empresa.service';

@Module({
  imports: [EventStoreModule, ScoreEngineModule, VektusAdapterModule],
  controllers: [EmpresaController],
  providers: [EmpresaService],
  exports: [EmpresaService],
})
export class EmpresaModule {}
