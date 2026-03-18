import { Module } from '@nestjs/common';
import { EventStoreModule } from '@compliancecore/sdk/event-store/event-store.module';
import { CobrancaController } from './cobranca.controller';
import { CobrancaService } from './cobranca.service';

@Module({
  imports: [EventStoreModule],
  controllers: [CobrancaController],
  providers: [CobrancaService],
  exports: [CobrancaService],
})
export class CobrancaModule {}
