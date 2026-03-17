import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDecisaoDto {
  @ApiProperty({ description: 'ID da empresa' })
  @IsString()
  @IsNotEmpty()
  empresaId: string;

  @ApiProperty({ description: 'Descricao da decisao fiscal' })
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @ApiProperty({ description: 'Fundamentacao legal' })
  @IsString()
  @IsNotEmpty()
  fundamentacaoLegal: string;

  @ApiPropertyOptional({ description: 'ID da simulacao vinculada' })
  @IsOptional()
  @IsString()
  simulacaoId?: string;
}
