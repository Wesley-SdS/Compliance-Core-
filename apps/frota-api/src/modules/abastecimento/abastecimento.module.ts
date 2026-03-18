import { Module } from '@nestjs/common';
import { EventStoreModule } from '@compliancecore/sdk/event-store/event-store.module';
import { AbastecimentoController } from './abastecimento.controller';
import { AbastecimentoService } from './abastecimento.service';

@Module({
  imports: [EventStoreModule],
  controllers: [AbastecimentoController],
  providers: [AbastecimentoService],
  exports: [AbastecimentoService],
})
export class AbastecimentoModule {}
