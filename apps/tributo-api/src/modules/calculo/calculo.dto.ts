import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TipoOperacao {
  VENDA_MERCADORIA = 'VENDA_MERCADORIA',
  PRESTACAO_SERVICO = 'PRESTACAO_SERVICO',
  IMPORTACAO = 'IMPORTACAO',
}

export class SimularCalculoDto {
  @ApiProperty({ description: 'ID da empresa' })
  @IsString()
  @IsNotEmpty()
  empresaId: string;

  @ApiProperty({ description: 'Faturamento bruto do periodo' })
  @IsNumber()
  @Min(0)
  faturamentoBruto: number;

  @ApiProperty({ enum: TipoOperacao, description: 'Tipo de operacao' })
  @IsEnum(TipoOperacao)
  tipoOperacao: TipoOperacao;

  @ApiPropertyOptional({ description: 'Aliquota CBS customizada' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  aliquotaCbs?: number;

  @ApiPropertyOptional({ description: 'Aliquota IBS customizada' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  aliquotaIbs?: number;

  @ApiPropertyOptional({ description: 'Aliquota Imposto Seletivo customizada' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  aliquotaIs?: number;

  @ApiPropertyOptional({ description: 'Creditos de PIS' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  creditosPis?: number;

  @ApiPropertyOptional({ description: 'Creditos de COFINS' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  creditosCofins?: number;

  @ApiProperty({ description: 'Competencia (ex: 2025-01)' })
  @IsString()
  @IsNotEmpty()
  competencia: string;

  @ApiPropertyOptional({ description: 'Descricao do calculo' })
  @IsOptional()
  @IsString()
  descricao?: string;
}
