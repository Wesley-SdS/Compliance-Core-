import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLoteDto {
  @ApiProperty({ description: 'ID do loteamento' })
  @IsString()
  @IsNotEmpty()
  loteamentoId: string;

  @ApiProperty({ description: 'Quadra do lote' })
  @IsString()
  @IsNotEmpty()
  quadra: string;

  @ApiProperty({ description: 'Numero do lote' })
  @IsString()
  @IsNotEmpty()
  numero: string;

  @ApiProperty({ description: 'Area em metros quadrados' })
  @IsNumber()
  @Min(0)
  areaM2: number;

  @ApiProperty({ description: 'Valor de venda em reais' })
  @IsNumber()
  @Min(0)
  valorVenda: number;

  @ApiPropertyOptional({ description: 'Medida da frente em metros' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  frente?: number;

  @ApiPropertyOptional({ description: 'Medida do fundo em metros' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fundo?: number;

  @ApiPropertyOptional({ description: 'Medida do lado direito em metros' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ladoDireito?: number;

  @ApiPropertyOptional({ description: 'Medida do lado esquerdo em metros' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ladoEsquerdo?: number;
}

export class UpdateLoteDto {
  @ApiPropertyOptional({ description: 'Area em metros quadrados' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  areaM2?: number;

  @ApiPropertyOptional({ description: 'Valor de venda em reais' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valorVenda?: number;

  @ApiPropertyOptional({ description: 'ID do comprador' })
  @IsOptional()
  @IsString()
  compradorId?: string;

  @ApiPropertyOptional({ description: 'Status do lote' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Se o contrato esta registrado em cartorio' })
  @IsOptional()
  @IsBoolean()
  contratoRegistrado?: boolean;
}

export enum SistemaFinanciamento {
  PRICE = 'PRICE',
  SAC = 'SAC',
}

export class SimularFinanciamentoDto {
  @ApiProperty({ description: 'ID do lote' })
  @IsString()
  @IsNotEmpty()
  loteId: string;

  @ApiProperty({ description: 'Valor da entrada em reais' })
  @IsNumber()
  @Min(0)
  valorEntrada: number;

  @ApiProperty({ description: 'Numero de parcelas' })
  @IsNumber()
  @Min(1)
  numeroParcelas: number;

  @ApiProperty({ description: 'Taxa de juros mensal (em %)' })
  @IsNumber()
  @Min(0)
  taxaJurosMensal: number;

  @ApiProperty({ enum: SistemaFinanciamento, description: 'Sistema de amortizacao (PRICE ou SAC)' })
  @IsEnum(SistemaFinanciamento)
  sistema: SistemaFinanciamento;
}
