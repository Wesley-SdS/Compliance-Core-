import { Module } from '@nestjs/common';
import { EventStoreModule } from '@compliancecore/sdk';
import { LoteController } from './lote.controller';
import { LoteService } from './lote.service';

@Module({
  imports: [EventStoreModule],
  controllers: [LoteController],
  providers: [LoteService],
  exports: [LoteService],
})
export class LoteModule {}
