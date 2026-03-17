import { Module } from '@nestjs/common';
import { OtimizadorController } from './otimizador.controller';
import { OtimizadorService } from './otimizador.service';

@Module({
  controllers: [OtimizadorController],
  providers: [OtimizadorService],
  exports: [OtimizadorService],
})
export class OtimizadorModule {}
