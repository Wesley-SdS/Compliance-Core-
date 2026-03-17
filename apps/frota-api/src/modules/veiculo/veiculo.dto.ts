import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVeiculoDto {
  @ApiProperty({ description: 'Placa do veiculo' })
  @IsString()
  @IsNotEmpty()
  placa: string;

  @ApiProperty({ description: 'RENAVAM do veiculo' })
  @IsString()
  @IsNotEmpty()
  renavam: string;

  @ApiProperty({ description: 'Marca do veiculo' })
  @IsString()
  @IsNotEmpty()
  marca: string;

  @ApiProperty({ description: 'Modelo do veiculo' })
  @IsString()
  @IsNotEmpty()
  modelo: string;

  @ApiProperty({ description: 'Ano de fabricacao' })
  @IsNumber()
  @Min(1900)
  anoFabricacao: number;

  @ApiProperty({ description: 'Ano do modelo' })
  @IsNumber()
  @Min(1900)
  anoModelo: number;

  @ApiProperty({ description: 'Tipo do veiculo' })
  @IsString()
  @IsNotEmpty()
  tipoVeiculo: string;

  @ApiPropertyOptional({ description: 'Capacidade de carga em kg' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacidadeCarga?: number;

  @ApiPropertyOptional({ description: 'Se possui tacografo' })
  @IsOptional()
  @IsBoolean()
  temTacografo?: boolean;

  @ApiPropertyOptional({ description: 'Validade do CRLV' })
  @IsOptional()
  @IsDateString()
  crlvValidade?: string;
}

export class UpdateVeiculoDto {
  @ApiPropertyOptional({ description: 'Marca do veiculo' })
  @IsOptional()
  @IsString()
  marca?: string;

  @ApiPropertyOptional({ description: 'Modelo do veiculo' })
  @IsOptional()
  @IsString()
  modelo?: string;

  @ApiPropertyOptional({ description: 'Tipo do veiculo' })
  @IsOptional()
  @IsString()
  tipoVeiculo?: string;

  @ApiPropertyOptional({ description: 'Capacidade de carga em kg' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacidadeCarga?: number;

  @ApiPropertyOptional({ description: 'Se possui tacografo' })
  @IsOptional()
  @IsBoolean()
  temTacografo?: boolean;

  @ApiPropertyOptional({ description: 'Se o tacografo esta aferido' })
  @IsOptional()
  @IsBoolean()
  tacografoAferido?: boolean;

  @ApiPropertyOptional({ description: 'Validade da afericao do tacografo' })
  @IsOptional()
  @IsDateString()
  tacografoValidade?: string;

  @ApiPropertyOptional({ description: 'Se o CRLV esta valido' })
  @IsOptional()
  @IsBoolean()
  crlvValido?: boolean;

  @ApiPropertyOptional({ description: 'Se o IPVA esta quitado' })
  @IsOptional()
  @IsBoolean()
  ipvaQuitado?: boolean;

  @ApiPropertyOptional({ description: 'Se o seguro esta valido' })
  @IsOptional()
  @IsBoolean()
  seguroValido?: boolean;

  @ApiPropertyOptional({ description: 'Se a manutencao esta em dia' })
  @IsOptional()
  @IsBoolean()
  manutencaoEmDia?: boolean;

  @ApiPropertyOptional({ description: 'Status do veiculo' })
  @IsOptional()
  @IsString()
  status?: string;
}
