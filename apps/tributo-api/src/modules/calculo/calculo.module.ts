import { Module } from '@nestjs/common';
import { EventStoreModule } from '@compliancecore/sdk/event-store/event-store.module';
import { CalculoController } from './calculo.controller';
import { CalculoService } from './calculo.service';

@Module({
  imports: [EventStoreModule],
  controllers: [CalculoController],
  providers: [CalculoService],
  exports: [CalculoService],
})
export class CalculoModule {}
