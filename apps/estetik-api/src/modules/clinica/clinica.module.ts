import { Module } from '@nestjs/common';
import { ClinicaController } from './clinica.controller';
import { ClinicaService } from './clinica.service';

@Module({
  controllers: [ClinicaController],
  providers: [ClinicaService],
  exports: [ClinicaService],
})
export class ClinicaModule {}
