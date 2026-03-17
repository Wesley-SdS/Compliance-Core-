import { Module } from '@nestjs/common';
import { ObraController } from './obra.controller';
import { ObraService } from './obra.service';
import {
  CriarObraUseCase,
  RegistrarNotaFiscalUseCase,
  ProcessarOCRCallbackUseCase,
} from './use-cases';

@Module({
  controllers: [ObraController],
  providers: [
    ObraService,
    CriarObraUseCase,
    RegistrarNotaFiscalUseCase,
    ProcessarOCRCallbackUseCase,
  ],
  exports: [ObraService, ProcessarOCRCallbackUseCase],
})
export class ObraModule {}
