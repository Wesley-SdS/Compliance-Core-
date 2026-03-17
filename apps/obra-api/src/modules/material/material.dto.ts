import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMaterialDto {
  @ApiProperty({ description: 'ID da obra' })
  @IsString()
  @IsNotEmpty()
  obraId: string;

  @ApiProperty({ description: 'Nome do material' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiPropertyOptional({ description: 'Descricao do material' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ description: 'Quantidade' })
  @IsNumber()
  @Min(0)
  quantidade: number;

  @ApiProperty({ description: 'Unidade de medida' })
  @IsString()
  @IsNotEmpty()
  unidade: string;

  @ApiPropertyOptional({ description: 'Fornecedor' })
  @IsOptional()
  @IsString()
  fornecedor?: string;

  @ApiPropertyOptional({ description: 'Numero da nota fiscal' })
  @IsOptional()
  @IsString()
  notaFiscal?: string;
}

export class UpdateMaterialDto {
  @ApiPropertyOptional({ description: 'Nome do material' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'Descricao do material' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({ description: 'Quantidade' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantidade?: number;

  @ApiPropertyOptional({ description: 'Unidade de medida' })
  @IsOptional()
  @IsString()
  unidade?: string;

  @ApiPropertyOptional({ description: 'Fornecedor' })
  @IsOptional()
  @IsString()
  fornecedor?: string;

  @ApiPropertyOptional({ description: 'Status do material' })
  @IsOptional()
  @IsString()
  status?: string;
}
