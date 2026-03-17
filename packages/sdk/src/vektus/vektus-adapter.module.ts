import { Module } from '@nestjs/common';
import { VektusAdapterService } from './vektus-adapter.service.js';

@Module({
  providers: [VektusAdapterService],
  exports: [VektusAdapterService],
})
export class VektusAdapterModule {}
