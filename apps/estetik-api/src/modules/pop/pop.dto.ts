import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GeneratePopDto {
  @ApiProperty({ description: 'ID do procedimento' })
  @IsString()
  @IsNotEmpty()
  procedimentoId: string;

  @ApiProperty({ description: 'Nome do procedimento' })
  @IsString()
  @IsNotEmpty()
  procedimentoNome: string;

  @ApiProperty({ description: 'Tipo do procedimento' })
  @IsString()
  @IsNotEmpty()
  procedimentoTipo: string;

  @ApiPropertyOptional({ description: 'Contexto adicional para geracao do POP' })
  @IsOptional()
  @IsString()
  contextoAdicional?: string;
}

export class ApprovePopDto {
  @ApiProperty({ description: 'Nome/ID de quem aprovou o POP' })
  @IsString()
  @IsNotEmpty()
  aprovadoPor: string;

  @ApiPropertyOptional({ description: 'Observacoes sobre a aprovacao' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
