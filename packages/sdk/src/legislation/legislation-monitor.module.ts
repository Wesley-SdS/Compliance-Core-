import { Module } from '@nestjs/common';
import { LegislationMonitorService } from './legislation-monitor.service.js';

@Module({
  providers: [LegislationMonitorService],
  exports: [LegislationMonitorService],
})
export class LegislationMonitorModule {}
