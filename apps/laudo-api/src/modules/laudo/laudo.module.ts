import { Module } from '@nestjs/common';
import { EventStoreModule, VektusAdapterModule } from '@compliancecore/sdk';
import { LaudoController } from './laudo.controller';
import { LaudoService } from './laudo.service';

@Module({
  imports: [EventStoreModule, VektusAdapterModule],
  controllers: [LaudoController],
  providers: [LaudoService],
  exports: [LaudoService],
})
export class LaudoModule {}
