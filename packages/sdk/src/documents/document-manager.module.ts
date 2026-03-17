import { Module } from '@nestjs/common';
import { DocumentManagerService } from './document-manager.service.js';

@Module({
  providers: [DocumentManagerService],
  exports: [DocumentManagerService],
})
export class DocumentManagerModule {}
