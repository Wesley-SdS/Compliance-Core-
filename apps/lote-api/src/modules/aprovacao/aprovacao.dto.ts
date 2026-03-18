import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AprovacaoTipo {
  PREFEITURA = 'PREFEITURA',
  CARTORIO = 'CARTORIO',
  GRAPROHAB = 'GRAPROHAB',
  AMBIENTAL = 'AMBIENTAL',
}

export enum AprovacaoStatus {
  PENDENTE = 'PENDENTE',
  EM_ANALISE = 'EM_ANALISE',
  APROVADO = 'APROVADO',
  NEGADO = 'NEGADO',
}

export class CreateAprovacaoDto {
  @ApiProperty({ description: 'ID do loteamento' })
  @IsString()
  @IsNotEmpty()
  loteamentoId: string;

  @ApiProperty({ enum: AprovacaoTipo, description: 'Tipo de aprovacao' })
  @IsEnum(AprovacaoTipo)
  tipo: AprovacaoTipo;

  @ApiPropertyOptional({ description: 'Numero do protocolo' })
  @IsOptional()
  @IsString()
  protocolo?: string;

  @ApiPropertyOptional({ description: 'Observacoes' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class UpdateAprovacaoDto {
  @ApiProperty({ enum: AprovacaoStatus, description: 'Status da aprovacao' })
  @IsEnum(AprovacaoStatus)
  status: AprovacaoStatus;

  @ApiPropertyOptional({ description: 'Data da aprovacao' })
  @IsOptional()
  @IsDateString()
  dataAprovacao?: string;

  @ApiPropertyOptional({ description: 'Numero do protocolo' })
  @IsOptional()
  @IsString()
  protocolo?: string;

  @ApiPropertyOptional({ description: 'Observacoes' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
