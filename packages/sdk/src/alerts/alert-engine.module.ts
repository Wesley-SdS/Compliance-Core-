import { Module } from '@nestjs/common';
import { AlertEngineService } from './alert-engine.service.js';

@Module({
  providers: [AlertEngineService],
  exports: [AlertEngineService],
})
export class AlertEngineModule {}
