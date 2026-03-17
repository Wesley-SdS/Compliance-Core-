import { Module } from '@nestjs/common';
import { EventStoreModule } from '@compliancecore/sdk/event-store/event-store.module';
import { VektusAdapterModule } from '@compliancecore/sdk/vektus/vektus-adapter.module';
import { SpedController } from './sped.controller';
import { SpedService } from './sped.service';

@Module({
  imports: [EventStoreModule, VektusAdapterModule],
  controllers: [SpedController],
  providers: [SpedService],
  exports: [SpedService],
})
export class SpedModule {}
