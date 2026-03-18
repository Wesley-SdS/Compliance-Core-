import { Module } from '@nestjs/common';
import { EventStoreModule } from '@compliancecore/sdk/event-store/event-store.module';
import { FrotaController } from './frota.controller';
import { FrotaService } from './frota.service';

@Module({
  imports: [EventStoreModule],
  controllers: [FrotaController],
  providers: [FrotaService],
  exports: [FrotaService],
})
export class FrotaModule {}
