import { Module } from '@nestjs/common';
import { EventStoreModule } from '@compliancecore/sdk/event-store/event-store.module';
import { AprovacaoController } from './aprovacao.controller';
import { AprovacaoService } from './aprovacao.service';

@Module({
  imports: [EventStoreModule],
  controllers: [AprovacaoController],
  providers: [AprovacaoService],
  exports: [AprovacaoService],
})
export class AprovacaoModule {}
