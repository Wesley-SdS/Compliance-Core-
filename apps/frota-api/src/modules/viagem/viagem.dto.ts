import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateViagemDto {
  @ApiProperty({ description: 'ID do veiculo' })
  @IsString()
  @IsNotEmpty()
  veiculoId: string;

  @ApiProperty({ description: 'ID do motorista' })
  @IsString()
  @IsNotEmpty()
  motoristaId: string;

  @ApiProperty({ description: 'Local de origem' })
  @IsString()
  @IsNotEmpty()
  origem: string;

  @ApiProperty({ description: 'Local de destino' })
  @IsString()
  @IsNotEmpty()
  destino: string;

  @ApiPropertyOptional({ description: 'Distancia em km' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distanciaKm?: number;

  @ApiPropertyOptional({ description: 'Descricao da carga' })
  @IsOptional()
  @IsString()
  cargaDescricao?: string;

  @ApiPropertyOptional({ description: 'Peso da carga em kg' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pesoKg?: number;

  @ApiPropertyOptional({ description: 'Numero do CIOT' })
  @IsOptional()
  @IsString()
  ciotNumero?: string;

  @ApiProperty({ description: 'Data de partida' })
  @IsDateString()
  dataPartida: string;

  @ApiProperty({ description: 'Data prevista de chegada' })
  @IsDateString()
  dataChegadaPrevista: string;
}

export class UpdateViagemDto {
  @ApiPropertyOptional({ description: 'Status da viagem' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Numero do CIOT' })
  @IsOptional()
  @IsString()
  ciotNumero?: string;

  @ApiPropertyOptional({ description: 'Data real de chegada' })
  @IsOptional()
  @IsDateString()
  dataChegadaReal?: string;

  @ApiPropertyOptional({ description: 'Km percorridos' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kmPercorridos?: number;

  @ApiPropertyOptional({ description: 'Observacoes' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class FinalizarViagemDto {
  @ApiProperty({ description: 'Km final da viagem' })
  @IsNumber()
  @Min(0)
  kmFim: number;
}

export enum TipoParada {
  DESCANSO = 'DESCANSO',
  REFEICAO = 'REFEICAO',
  CARGA = 'CARGA',
  DESCARGA = 'DESCARGA',
}

export class RegistrarParadaDto {
  @ApiProperty({ enum: TipoParada, description: 'Tipo da parada' })
  @IsEnum(TipoParada)
  tipo: TipoParada;
}
