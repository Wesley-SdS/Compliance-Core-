import { Module } from '@nestjs/common';
import { ScoreEngineService } from './score-engine.service.js';

@Module({
  providers: [ScoreEngineService],
  exports: [ScoreEngineService],
})
export class ScoreEngineModule {}
