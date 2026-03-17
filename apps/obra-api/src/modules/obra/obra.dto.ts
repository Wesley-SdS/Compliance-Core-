import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum TipoObra {
  RESIDENCIAL = 'RESIDENCIAL',
  COMERCIAL = 'COMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL',
  INFRAESTRUTURA = 'INFRAESTRUTURA',
  REFORMA = 'REFORMA',
  MISTA = 'MISTA',
}

export class CreateObraDto {
  @ApiProperty({ description: 'Nome da obra' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'Endereco da obra' })
  @IsString()
  @IsNotEmpty()
  endereco: string;

  @ApiProperty({ description: 'Responsavel tecnico' })
  @IsString()
  @IsNotEmpty()
  responsavel: string;

  @ApiProperty({ enum: TipoObra, description: 'Tipo da obra' })
  @IsEnum(TipoObra)
  tipoObra: TipoObra;

  @ApiProperty({ description: 'Area em metros quadrados' })
  @IsNumber()
  @Min(0)
  areaM2: number;

  @ApiProperty({ description: 'Numero de pavimentos' })
  @IsNumber()
  @Min(0)
  numeroPavimentos: number;

  @ApiProperty({ description: 'Data prevista de inicio' })
  @IsDateString()
  inicioPrevisao: string;

  @ApiProperty({ description: 'Data prevista de conclusao' })
  @IsDateString()
  fimPrevisao: string;

  @ApiPropertyOptional({ description: 'CNPJ da construtora' })
  @IsOptional()
  @IsString()
  cnpjConstrutora?: string;

  @ApiPropertyOptional({ description: 'Numero do CREA do responsavel' })
  @IsOptional()
  @IsString()
  creaResponsavel?: string;
}

export class UpdateObraDto extends PartialType(CreateObraDto) {}
