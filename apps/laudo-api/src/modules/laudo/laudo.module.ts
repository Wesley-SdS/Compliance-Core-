import { Module } from '@nestjs/common';
import { EventStoreModule } from '@compliancecore/sdk/event-store/event-store.module';
import { VektusAdapterModule } from '@compliancecore/sdk/vektus/vektus-adapter.module';
import { LaudoController } from './laudo.controller';
import { LaudoService } from './laudo.service';

@Module({
  imports: [EventStoreModule, VektusAdapterModule],
  controllers: [LaudoController],
  providers: [LaudoService],
  exports: [LaudoService],
})
export class LaudoModule {}
