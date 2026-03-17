import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Impacto {
  ALTO = 'ALTO',
  MEDIO = 'MEDIO',
  BAIXO = 'BAIXO',
}

export class CreateLegislacaoDto {
  @ApiProperty({ description: 'Titulo da legislacao' })
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiProperty({ description: 'Fonte (ex: DOU, Receita Federal)' })
  @IsString()
  @IsNotEmpty()
  fonte: string;

  @ApiProperty({ description: 'Data de publicacao (ISO)' })
  @IsString()
  @IsNotEmpty()
  data: string;

  @ApiProperty({ description: 'Resumo do conteudo' })
  @IsString()
  @IsNotEmpty()
  resumo: string;

  @ApiProperty({ enum: Impacto, description: 'Nivel de impacto' })
  @IsEnum(Impacto)
  impacto: Impacto;

  @ApiPropertyOptional({ description: 'Marcar como nova' })
  @IsOptional()
  @IsBoolean()
  novo?: boolean;
}
