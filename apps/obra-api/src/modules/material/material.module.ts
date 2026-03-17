import { Module } from '@nestjs/common';
import { MaterialController } from './material.controller';
import { MaterialService } from './material.service';
import { TransferirMaterialUseCase } from '../obra/use-cases/transferir-material.use-case';

@Module({
  controllers: [MaterialController],
  providers: [MaterialService, TransferirMaterialUseCase],
  exports: [MaterialService],
})
export class MaterialModule {}
