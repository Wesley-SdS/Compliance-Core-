import { Module } from '@nestjs/common';
import { EventStoreModule } from '@compliancecore/sdk';
import { EquipamentoController } from './equipamento.controller';
import { EquipamentoService } from './equipamento.service';

@Module({
  imports: [EventStoreModule],
  controllers: [EquipamentoController],
  providers: [EquipamentoService],
  exports: [EquipamentoService],
})
export class EquipamentoModule {}
