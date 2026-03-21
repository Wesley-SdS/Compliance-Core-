import { Module } from '@nestjs/common';
import { EventStoreModule, ScoreEngineModule, VektusAdapterModule } from '@compliancecore/sdk';
import { LaboratorioController } from './laboratorio.controller';
import { LaboratorioService } from './laboratorio.service';

@Module({
  imports: [EventStoreModule, ScoreEngineModule, VektusAdapterModule],
  controllers: [LaboratorioController],
  providers: [LaboratorioService],
  exports: [LaboratorioService],
})
export class LaboratorioModule {}
