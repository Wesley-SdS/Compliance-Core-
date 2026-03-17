import { Module } from '@nestjs/common';
import { EtapaController } from './etapa.controller';
import { EtapaService } from './etapa.service';

@Module({
  controllers: [EtapaController],
  providers: [EtapaService],
  exports: [EtapaService],
})
export class EtapaModule {}
