import { Module } from '@nestjs/common';
import { SpedController } from './sped.controller';
import { SpedService } from './sped.service';

@Module({
  controllers: [SpedController],
  providers: [SpedService],
  exports: [SpedService],
})
export class SpedModule {}
