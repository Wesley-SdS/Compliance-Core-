import { Module } from '@nestjs/common';
import { EventStoreModule } from '@compliancecore/sdk/event-store/event-store.module';
import { EtapaController } from './etapa.controller';
import { EtapaService } from './etapa.service';

@Module({
  imports: [EventStoreModule],
  controllers: [EtapaController],
  providers: [EtapaService],
  exports: [EtapaService],
})
export class EtapaModule {}
