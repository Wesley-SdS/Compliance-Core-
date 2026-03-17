import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateEtapaDto {
  @ApiProperty({ description: 'ID da obra' })
  @IsString()
  @IsNotEmpty()
  obraId: string;

  @ApiProperty({ description: 'Nome da etapa' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'Tipo da etapa' })
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @ApiProperty({ description: 'Ordem da etapa' })
  @IsNumber()
  @Min(0)
  ordem: number;

  @ApiProperty({ description: 'Data prevista de inicio' })
  @IsDateString()
  inicioPrevisao: string;

  @ApiProperty({ description: 'Data prevista de conclusao' })
  @IsDateString()
  fimPrevisao: string;

  @ApiPropertyOptional({ description: 'Descricao da etapa' })
  @IsOptional()
  @IsString()
  descricao?: string;
}

export class UpdateEtapaDto {
  @ApiPropertyOptional({ description: 'Nome da etapa' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'Tipo da etapa' })
  @IsOptional()
  @IsString()
  tipo?: string;

  @ApiPropertyOptional({ description: 'Ordem da etapa' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ordem?: number;

  @ApiPropertyOptional({ description: 'Status da etapa' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Data real de inicio' })
  @IsOptional()
  @IsDateString()
  inicioReal?: string;

  @ApiPropertyOptional({ description: 'Data real de conclusao' })
  @IsOptional()
  @IsDateString()
  fimReal?: string;

  @ApiPropertyOptional({ description: 'Descricao da etapa' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({ description: 'Percentual concluido (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentualConcluido?: number;
}
