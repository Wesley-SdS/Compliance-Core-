import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEquipamentoDto {
  @ApiProperty({ description: 'ID do laboratorio' })
  @IsString()
  @IsNotEmpty()
  laboratorioId: string;

  @ApiProperty({ description: 'Nome do equipamento' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'Fabricante do equipamento' })
  @IsString()
  @IsNotEmpty()
  fabricante: string;

  @ApiProperty({ description: 'Modelo do equipamento' })
  @IsString()
  @IsNotEmpty()
  modelo: string;

  @ApiProperty({ description: 'Numero de serie' })
  @IsString()
  @IsNotEmpty()
  numeroSerie: string;

  @ApiProperty({ description: 'Data de aquisicao' })
  @IsDateString()
  dataAquisicao: string;

  @ApiProperty({ description: 'Data da proxima calibracao' })
  @IsDateString()
  proximaCalibracao: string;

  @ApiPropertyOptional({ description: 'Possui rastreabilidade metrologica' })
  @IsOptional()
  @IsBoolean()
  rastreabilidade?: boolean;
}

export class UpdateEquipamentoDto {
  @ApiPropertyOptional({ description: 'Nome do equipamento' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'Fabricante do equipamento' })
  @IsOptional()
  @IsString()
  fabricante?: string;

  @ApiPropertyOptional({ description: 'Modelo do equipamento' })
  @IsOptional()
  @IsString()
  modelo?: string;

  @ApiPropertyOptional({ description: 'Status do equipamento' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Data da proxima calibracao' })
  @IsOptional()
  @IsDateString()
  proximaCalibracao?: string;

  @ApiPropertyOptional({ description: 'Se a calibracao esta valida' })
  @IsOptional()
  @IsBoolean()
  calibracaoValida?: boolean;

  @ApiPropertyOptional({ description: 'Possui rastreabilidade metrologica' })
  @IsOptional()
  @IsBoolean()
  rastreabilidade?: boolean;
}

export enum ResultadoCalibracao {
  APROVADO = 'APROVADO',
  REPROVADO = 'REPROVADO',
  APROVADO_COM_RESTRICAO = 'APROVADO_COM_RESTRICAO',
}

export class RegistrarCalibracaoDto {
  @ApiProperty({ description: 'Data da calibracao' })
  @IsDateString()
  dataCalibracao: string;

  @ApiProperty({ description: 'Data da proxima calibracao' })
  @IsDateString()
  proximaCalibracao: string;

  @ApiProperty({ description: 'Laboratorio que realizou a calibracao' })
  @IsString()
  @IsNotEmpty()
  laboratorioCalibrador: string;

  @ApiProperty({ description: 'Numero do certificado de calibracao' })
  @IsString()
  @IsNotEmpty()
  certificadoNumero: string;

  @ApiProperty({ enum: ResultadoCalibracao, description: 'Resultado da calibracao' })
  @IsEnum(ResultadoCalibracao)
  resultado: ResultadoCalibracao;

  @ApiPropertyOptional({ description: 'Observacoes sobre a calibracao' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
