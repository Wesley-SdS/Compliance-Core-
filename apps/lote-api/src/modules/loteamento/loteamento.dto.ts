import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLoteamentoDto {
  @ApiProperty({ description: 'Nome do loteamento' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'Endereco do loteamento' })
  @IsString()
  @IsNotEmpty()
  endereco: string;

  @ApiProperty({ description: 'Cidade' })
  @IsString()
  @IsNotEmpty()
  cidade: string;

  @ApiProperty({ description: 'Estado (UF)' })
  @IsString()
  @IsNotEmpty()
  estado: string;

  @ApiProperty({ description: 'Area total em metros quadrados' })
  @IsNumber()
  @Min(0)
  areaTotal: number;

  @ApiProperty({ description: 'Total de lotes no loteamento' })
  @IsNumber()
  @Min(1)
  totalLotes: number;

  @ApiPropertyOptional({ description: 'Numero da matricula no cartorio' })
  @IsOptional()
  @IsString()
  matriculaNumero?: string;

  @ApiPropertyOptional({ description: 'Se possui registro em cartorio' })
  @IsOptional()
  @IsBoolean()
  registroCartorio?: boolean;

  @ApiPropertyOptional({ description: 'Se possui aprovacao da prefeitura' })
  @IsOptional()
  @IsBoolean()
  aprovacaoPrefeitura?: boolean;

  @ApiProperty({ description: 'Responsavel pelo loteamento' })
  @IsString()
  @IsNotEmpty()
  responsavel: string;

  @ApiProperty({ description: 'CNPJ do loteador' })
  @IsString()
  @IsNotEmpty()
  cnpjLoteador: string;
}

export class UpdateLoteamentoDto {
  @ApiPropertyOptional({ description: 'Nome do loteamento' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'Endereco do loteamento' })
  @IsOptional()
  @IsString()
  endereco?: string;

  @ApiPropertyOptional({ description: 'Numero da matricula no cartorio' })
  @IsOptional()
  @IsString()
  matriculaNumero?: string;

  @ApiPropertyOptional({ description: 'Se possui registro em cartorio' })
  @IsOptional()
  @IsBoolean()
  registroCartorio?: boolean;

  @ApiPropertyOptional({ description: 'Se possui aprovacao da prefeitura' })
  @IsOptional()
  @IsBoolean()
  aprovacaoPrefeitura?: boolean;

  @ApiPropertyOptional({ description: 'Se as areas publicas foram entregues' })
  @IsOptional()
  @IsBoolean()
  areasPublicasEntregues?: boolean;

  @ApiPropertyOptional({ description: 'Se a infraestrutura minima esta pronta' })
  @IsOptional()
  @IsBoolean()
  infraestruturaMinima?: boolean;

  @ApiPropertyOptional({ description: 'Se a DIMOB foi entregue' })
  @IsOptional()
  @IsBoolean()
  dimobEntregue?: boolean;

  @ApiPropertyOptional({ description: 'Se a EFD-Reinf foi entregue' })
  @IsOptional()
  @IsBoolean()
  efdReinfEntregue?: boolean;

  @ApiPropertyOptional({ description: 'Status do loteamento' })
  @IsOptional()
  @IsString()
  status?: string;
}
