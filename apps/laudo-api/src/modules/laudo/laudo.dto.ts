import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLaudoDto {
  @ApiProperty({ description: 'ID do laboratorio' })
  @IsString()
  @IsNotEmpty()
  laboratorioId: string;

  @ApiPropertyOptional({ description: 'ID do paciente' })
  @IsOptional()
  @IsString()
  pacienteId?: string;

  @ApiProperty({ description: 'Tipo do exame' })
  @IsString()
  @IsNotEmpty()
  tipoExame: string;

  @ApiProperty({ description: 'Material biologico coletado' })
  @IsString()
  @IsNotEmpty()
  materialBiologico: string;

  @ApiProperty({ description: 'Metodologia utilizada' })
  @IsString()
  @IsNotEmpty()
  metodologia: string;

  @ApiPropertyOptional({ description: 'Resultado do exame' })
  @IsOptional()
  @IsString()
  resultado?: string;

  @ApiPropertyOptional({ description: 'Unidade de medida' })
  @IsOptional()
  @IsString()
  unidade?: string;

  @ApiPropertyOptional({ description: 'Valor de referencia' })
  @IsOptional()
  @IsString()
  valorReferencia?: string;

  @ApiPropertyOptional({ description: 'Observacoes' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class UpdateLaudoDto {
  @ApiPropertyOptional({ description: 'Resultado do exame' })
  @IsOptional()
  @IsString()
  resultado?: string;

  @ApiPropertyOptional({ description: 'Unidade de medida' })
  @IsOptional()
  @IsString()
  unidade?: string;

  @ApiPropertyOptional({ description: 'Valor de referencia' })
  @IsOptional()
  @IsString()
  valorReferencia?: string;

  @ApiPropertyOptional({ description: 'Observacoes' })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({ description: 'Status do laudo' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Se o laudo esta assinado' })
  @IsOptional()
  @IsBoolean()
  laudoAssinado?: boolean;

  @ApiPropertyOptional({ description: 'Nome de quem assinou' })
  @IsOptional()
  @IsString()
  assinadoPor?: string;
}
