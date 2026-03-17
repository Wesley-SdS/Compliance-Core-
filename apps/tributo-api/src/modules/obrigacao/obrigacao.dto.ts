import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StatusObrigacao {
  PENDENTE = 'pendente',
  ENTREGUE = 'entregue',
  ATRASADO = 'atrasado',
}

export class CreateObrigacaoDto {
  @ApiProperty({ description: 'ID da empresa' })
  @IsString()
  @IsNotEmpty()
  empresaId: string;

  @ApiProperty({ description: 'Nome da obrigacao' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'Competencia (ex: 2025-01)' })
  @IsString()
  @IsNotEmpty()
  competencia: string;

  @ApiProperty({ description: 'Data de vencimento (ISO)' })
  @IsString()
  @IsNotEmpty()
  vencimento: string;
}

export class UpdateObrigacaoStatusDto {
  @ApiProperty({ enum: StatusObrigacao, description: 'Novo status' })
  @IsEnum(StatusObrigacao)
  status: StatusObrigacao;
}
