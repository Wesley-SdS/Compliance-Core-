import { Module } from '@nestjs/common';
import { EventStoreModule } from '@compliancecore/sdk/event-store/event-store.module';
import { ContratoController } from './contrato.controller';
import { ContratoService } from './contrato.service';

@Module({
  imports: [EventStoreModule],
  controllers: [ContratoController],
  providers: [ContratoService],
  exports: [ContratoService],
})
export class ContratoModule {}
