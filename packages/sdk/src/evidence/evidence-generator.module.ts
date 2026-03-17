import { Module } from '@nestjs/common';
import { EvidenceGeneratorService } from './evidence-generator.service.js';

@Module({
  providers: [EvidenceGeneratorService],
  exports: [EvidenceGeneratorService],
})
export class EvidenceGeneratorModule {}
