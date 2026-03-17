import { Module } from '@nestjs/common';
import { EventStoreModule } from '@compliancecore/sdk/event-store/event-store.module';
import { VektusAdapterModule } from '@compliancecore/sdk/vektus/vektus-adapter.module';
import { MaterialController } from './material.controller';
import { MaterialService } from './material.service';

@Module({
  imports: [EventStoreModule, VektusAdapterModule],
  controllers: [MaterialController],
  providers: [MaterialService],
  exports: [MaterialService],
})
export class MaterialModule {}
