import { Module } from '@nestjs/common';
import { EventStoreModule } from '@compliancecore/sdk';
import { CompradorController } from './comprador.controller';
import { CompradorService } from './comprador.service';

@Module({
  imports: [EventStoreModule],
  controllers: [CompradorController],
  providers: [CompradorService],
  exports: [CompradorService],
})
export class CompradorModule {}
