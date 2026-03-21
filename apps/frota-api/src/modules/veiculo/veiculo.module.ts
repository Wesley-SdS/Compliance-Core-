import { Module } from '@nestjs/common';
import { EventStoreModule, ScoreEngineModule, VektusAdapterModule } from '@compliancecore/sdk';
import { VeiculoController } from './veiculo.controller';
import { VeiculoService } from './veiculo.service';

@Module({
  imports: [EventStoreModule, ScoreEngineModule, VektusAdapterModule],
  controllers: [VeiculoController],
  providers: [VeiculoService],
  exports: [VeiculoService],
})
export class VeiculoModule {}
