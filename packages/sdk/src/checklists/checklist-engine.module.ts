import { Module } from '@nestjs/common';
import { ChecklistEngineService } from './checklist-engine.service.js';

@Module({
  providers: [ChecklistEngineService],
  exports: [ChecklistEngineService],
})
export class ChecklistEngineModule {}
