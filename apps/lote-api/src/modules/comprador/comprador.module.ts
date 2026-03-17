import { Module } from '@nestjs/common';
import { EventStoreModule } from '@compliancecore/sdk/event-store/event-store.module';
import { CompradorController } from './comprador.controller';
import { CompradorService } from './comprador.service';

@Module({
  imports: [EventStoreModule],
  controllers: [CompradorController],
  providers: [CompradorService],
  exports: [CompradorService],
})
export class CompradorModule {}
