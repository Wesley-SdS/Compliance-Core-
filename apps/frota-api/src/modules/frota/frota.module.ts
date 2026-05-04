import { Module } from '@nestjs/common';
import { FrotaController } from './frota.controller';
import { FrotaService } from './frota.service';

@Module({
  controllers: [FrotaController],
  providers: [FrotaService],
  exports: [FrotaService],
})
export class FrotaModule {}
