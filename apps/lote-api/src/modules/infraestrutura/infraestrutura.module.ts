import { Module } from '@nestjs/common';
import { InfraestruturaController } from './infraestrutura.controller';
import { InfraestruturaService } from './infraestrutura.service';

@Module({
  controllers: [InfraestruturaController],
  providers: [InfraestruturaService],
  exports: [InfraestruturaService],
})
export class InfraestruturaModule {}
