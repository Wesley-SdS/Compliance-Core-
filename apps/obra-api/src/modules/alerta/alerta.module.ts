import { Module } from '@nestjs/common';
import { AlertaController } from './alerta.controller';

@Module({
  controllers: [AlertaController],
})
export class AlertaModule {}
