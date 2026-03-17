import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TipoSped {
  FISCAL = 'FISCAL',
  CONTABIL = 'CONTABIL',
  CONTRIBUICOES = 'CONTRIBUICOES',
}

export class UploadSpedDto {
  @ApiProperty({ description: 'ID da empresa' })
  @IsString()
  @IsNotEmpty()
  empresaId: string;

  @ApiProperty({ enum: TipoSped, description: 'Tipo do arquivo SPED' })
  @IsEnum(TipoSped)
  tipoSped: TipoSped;

  @ApiProperty({ description: 'Competencia (ex: 2025-01)' })
  @IsString()
  @IsNotEmpty()
  competencia: string;

  @ApiProperty({ description: 'Nome do arquivo' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: 'Conteudo do arquivo (base64 ou texto)' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
