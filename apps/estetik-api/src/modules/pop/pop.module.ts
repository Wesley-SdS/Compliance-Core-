import { Module } from '@nestjs/common';
import { PopController } from './pop.controller';
import { PopService } from './pop.service';
import { GerarPOPUseCase } from '../../use-cases/gerar-pop.use-case';

@Module({
  controllers: [PopController],
  providers: [PopService, GerarPOPUseCase],
  exports: [PopService],
})
export class PopModule {}
