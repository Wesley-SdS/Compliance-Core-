import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMotoristaDto {
  @ApiProperty({ description: 'Nome do motorista' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'CPF do motorista' })
  @IsString()
  @IsNotEmpty()
  cpf: string;

  @ApiProperty({ description: 'Numero da CNH' })
  @IsString()
  @IsNotEmpty()
  cnhNumero: string;

  @ApiProperty({ description: 'Categoria da CNH' })
  @IsString()
  @IsNotEmpty()
  cnhCategoria: string;

  @ApiProperty({ description: 'Data de validade da CNH' })
  @IsDateString()
  cnhValidade: string;

  @ApiPropertyOptional({ description: 'Telefone do motorista' })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiPropertyOptional({ description: 'Se transporta carga perigosa' })
  @IsOptional()
  @IsBoolean()
  transportaPerigoso?: boolean;

  @ApiPropertyOptional({ description: 'Se o MOPP esta valido' })
  @IsOptional()
  @IsBoolean()
  moppValido?: boolean;

  @ApiPropertyOptional({ description: 'Data de validade do MOPP' })
  @IsOptional()
  @IsDateString()
  moppValidade?: string;
}

export class UpdateMotoristaDto {
  @ApiPropertyOptional({ description: 'Nome do motorista' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'Categoria da CNH' })
  @IsOptional()
  @IsString()
  cnhCategoria?: string;

  @ApiPropertyOptional({ description: 'Data de validade da CNH' })
  @IsOptional()
  @IsDateString()
  cnhValidade?: string;

  @ApiPropertyOptional({ description: 'Telefone do motorista' })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiPropertyOptional({ description: 'Se transporta carga perigosa' })
  @IsOptional()
  @IsBoolean()
  transportaPerigoso?: boolean;

  @ApiPropertyOptional({ description: 'Se o MOPP esta valido' })
  @IsOptional()
  @IsBoolean()
  moppValido?: boolean;

  @ApiPropertyOptional({ description: 'Data de validade do MOPP' })
  @IsOptional()
  @IsDateString()
  moppValidade?: string;

  @ApiPropertyOptional({ description: 'Se esta em viagem' })
  @IsOptional()
  @IsBoolean()
  emViagem?: boolean;

  @ApiPropertyOptional({ description: 'Se esta com descanso conforme a lei' })
  @IsOptional()
  @IsBoolean()
  descansoConforme?: boolean;

  @ApiPropertyOptional({ description: 'Status do motorista' })
  @IsOptional()
  @IsString()
  status?: string;
}

export enum TipoDescanso {
  INTERVALO_REFEICAO = 'INTERVALO_REFEICAO',
  DESCANSO_11H = 'DESCANSO_11H',
  DESCANSO_SEMANAL = 'DESCANSO_SEMANAL',
}

export class RegistrarDescansoDto {
  @ApiProperty({ description: 'ID do motorista' })
  @IsString()
  @IsNotEmpty()
  motoristaId: string;

  @ApiPropertyOptional({ description: 'ID da viagem' })
  @IsOptional()
  @IsString()
  viagemId?: string;

  @ApiProperty({ enum: TipoDescanso, description: 'Tipo de descanso' })
  @IsEnum(TipoDescanso)
  tipo: TipoDescanso;

  @ApiProperty({ description: 'Data/hora de inicio do descanso' })
  @IsDateString()
  inicio: string;

  @ApiPropertyOptional({ description: 'Data/hora de fim do descanso' })
  @IsOptional()
  @IsDateString()
  fim?: string;

  @ApiPropertyOptional({ description: 'Local do descanso' })
  @IsOptional()
  @IsString()
  localDescanso?: string;
}
