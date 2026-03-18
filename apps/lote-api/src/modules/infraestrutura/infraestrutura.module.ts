import { Module } from '@nestjs/common';
import { EventStoreModule } from '@compliancecore/sdk/event-store/event-store.module';
import { InfraestruturaController } from './infraestrutura.controller';
import { InfraestruturaService } from './infraestrutura.service';

@Module({
  imports: [EventStoreModule],
  controllers: [InfraestruturaController],
  providers: [InfraestruturaService],
  exports: [InfraestruturaService],
})
export class InfraestruturaModule {}
