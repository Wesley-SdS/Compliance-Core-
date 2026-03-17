import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum RegimeTributario {
  SIMPLES_NACIONAL = 'SIMPLES_NACIONAL',
  LUCRO_PRESUMIDO = 'LUCRO_PRESUMIDO',
  LUCRO_REAL = 'LUCRO_REAL',
  MEI = 'MEI',
}

export class CreateEmpresaDto {
  @ApiProperty({ description: 'Razao social da empresa' })
  @IsString()
  @IsNotEmpty()
  razaoSocial: string;

  @ApiProperty({ description: 'Nome fantasia' })
  @IsString()
  @IsNotEmpty()
  nomeFantasia: string;

  @ApiProperty({ description: 'CNPJ da empresa' })
  @IsString()
  @IsNotEmpty()
  cnpj: string;

  @ApiPropertyOptional({ description: 'Inscricao estadual' })
  @IsOptional()
  @IsString()
  inscricaoEstadual?: string;

  @ApiPropertyOptional({ description: 'Inscricao municipal' })
  @IsOptional()
  @IsString()
  inscricaoMunicipal?: string;

  @ApiProperty({ enum: RegimeTributario, description: 'Regime tributario' })
  @IsEnum(RegimeTributario)
  regimeTributario: RegimeTributario;

  @ApiPropertyOptional({ description: 'CNAE principal' })
  @IsOptional()
  @IsString()
  cnaePrincipal?: string;

  @ApiPropertyOptional({ description: 'Endereco' })
  @IsOptional()
  @IsString()
  endereco?: string;

  @ApiPropertyOptional({ description: 'Email de contato' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Telefone de contato' })
  @IsOptional()
  @IsString()
  telefone?: string;
}

export class UpdateEmpresaDto extends PartialType(CreateEmpresaDto) {
  @ApiPropertyOptional({ description: 'Regime verificado' })
  @IsOptional()
  @IsBoolean()
  regimeVerificado?: boolean;

  @ApiPropertyOptional({ description: 'LGPD compliance' })
  @IsOptional()
  @IsBoolean()
  lgpdCompliance?: boolean;

  @ApiPropertyOptional({ description: 'Backup atualizado' })
  @IsOptional()
  @IsBoolean()
  backupAtualizado?: boolean;
}
