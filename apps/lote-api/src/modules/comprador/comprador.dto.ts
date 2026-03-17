import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompradorDto {
  @ApiProperty({ description: 'ID do loteamento' })
  @IsString()
  @IsNotEmpty()
  loteamentoId: string;

  @ApiProperty({ description: 'Nome do comprador' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'CPF ou CNPJ do comprador' })
  @IsString()
  @IsNotEmpty()
  cpfCnpj: string;

  @ApiPropertyOptional({ description: 'Email do comprador' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Telefone do comprador' })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiPropertyOptional({ description: 'Endereco do comprador' })
  @IsOptional()
  @IsString()
  endereco?: string;

  @ApiPropertyOptional({ description: 'Se deu consentimento LGPD' })
  @IsOptional()
  @IsBoolean()
  lgpdConsentimento?: boolean;

  @ApiPropertyOptional({ description: 'Data do consentimento LGPD' })
  @IsOptional()
  @IsDateString()
  lgpdConsentimentoData?: string;
}

export class UpdateCompradorDto {
  @ApiPropertyOptional({ description: 'Nome do comprador' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'Email do comprador' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Telefone do comprador' })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiPropertyOptional({ description: 'Endereco do comprador' })
  @IsOptional()
  @IsString()
  endereco?: string;

  @ApiPropertyOptional({ description: 'Se deu consentimento LGPD' })
  @IsOptional()
  @IsBoolean()
  lgpdConsentimento?: boolean;

  @ApiPropertyOptional({ description: 'Data do consentimento LGPD' })
  @IsOptional()
  @IsDateString()
  lgpdConsentimentoData?: string;

  @ApiPropertyOptional({ description: 'Status do comprador' })
  @IsOptional()
  @IsString()
  status?: string;
}
