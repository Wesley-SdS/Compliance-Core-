import { Module } from '@nestjs/common';
import { EventStoreModule } from '@compliancecore/sdk';
import { ViagemController } from './viagem.controller';
import { ViagemService } from './viagem.service';

@Module({
  imports: [EventStoreModule],
  controllers: [ViagemController],
  providers: [ViagemService],
  exports: [ViagemService],
})
export class ViagemModule {}
