import { Module } from '@nestjs/common';
import { EventStoreModule } from '@compliancecore/sdk/event-store/event-store.module';
import { ManutencaoController } from './manutencao.controller';
import { ManutencaoService } from './manutencao.service';

@Module({
  imports: [EventStoreModule],
  controllers: [ManutencaoController],
  providers: [ManutencaoService],
  exports: [ManutencaoService],
})
export class ManutencaoModule {}
