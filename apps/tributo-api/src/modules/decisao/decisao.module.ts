import { Module } from '@nestjs/common';
import { DecisaoController } from './decisao.controller';
import { DecisaoService } from './decisao.service';

@Module({
  controllers: [DecisaoController],
  providers: [DecisaoService],
  exports: [DecisaoService],
})
export class DecisaoModule {}
