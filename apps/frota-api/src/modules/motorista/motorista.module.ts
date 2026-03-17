import { Module } from '@nestjs/common';
import { EventStoreModule } from '@compliancecore/sdk/event-store/event-store.module';
import { MotoristaController } from './motorista.controller';
import { MotoristaService } from './motorista.service';

@Module({
  imports: [EventStoreModule],
  controllers: [MotoristaController],
  providers: [MotoristaService],
  exports: [MotoristaService],
})
export class MotoristaModule {}
