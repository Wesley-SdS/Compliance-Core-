import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateLaboratorioDto {
  @ApiProperty({ description: 'Nome do laboratorio' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'CNPJ do laboratorio' })
  @IsString()
  @IsNotEmpty()
  cnpj: string;

  @ApiProperty({ description: 'Endereco do laboratorio' })
  @IsString()
  @IsNotEmpty()
  endereco: string;

  @ApiProperty({ description: 'Responsavel tecnico' })
  @IsString()
  @IsNotEmpty()
  responsavelTecnico: string;

  @ApiPropertyOptional({ description: 'Numero do CRBM' })
  @IsOptional()
  @IsString()
  crbm?: string;

  @ApiProperty({ description: 'Tipo do laboratorio' })
  @IsString()
  @IsNotEmpty()
  tipoLaboratorio: string;

  @ApiPropertyOptional({ description: 'Especialidades do laboratorio', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  especialidades?: string[];
}

export class UpdateLaboratorioDto {
  @ApiPropertyOptional({ description: 'Nome do laboratorio' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'Endereco do laboratorio' })
  @IsOptional()
  @IsString()
  endereco?: string;

  @ApiPropertyOptional({ description: 'Responsavel tecnico' })
  @IsOptional()
  @IsString()
  responsavelTecnico?: string;

  @ApiPropertyOptional({ description: 'Numero do CRBM' })
  @IsOptional()
  @IsString()
  crbm?: string;

  @ApiPropertyOptional({ description: 'Tipo do laboratorio' })
  @IsOptional()
  @IsString()
  tipoLaboratorio?: string;

  @ApiPropertyOptional({ description: 'Especialidades do laboratorio', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  especialidades?: string[];
}
