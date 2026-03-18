import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InfraestruturaItem {
  AGUA = 'agua',
  ESGOTO = 'esgoto',
  ENERGIA = 'energia',
  PAVIMENTACAO = 'pavimentacao',
  DRENAGEM = 'drenagem',
  ILUMINACAO = 'iluminacao',
}

export class UpdateInfraestruturaDto {
  @ApiProperty({ enum: InfraestruturaItem, description: 'Item de infraestrutura' })
  @IsEnum(InfraestruturaItem)
  item: InfraestruturaItem;

  @ApiProperty({ description: 'Percentual de conclusao (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentual: number;

  @ApiPropertyOptional({ description: 'Responsavel pela obra' })
  @IsOptional()
  @IsString()
  responsavel?: string;

  @ApiPropertyOptional({ description: 'Prazo previsto' })
  @IsOptional()
  @IsString()
  prazo?: string;

  @ApiPropertyOptional({ description: 'Observacoes' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class UploadEvidenciaDto {
  @ApiProperty({ enum: InfraestruturaItem, description: 'Item de infraestrutura' })
  @IsEnum(InfraestruturaItem)
  item: InfraestruturaItem;

  @ApiProperty({ description: 'Descricao da evidencia' })
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @ApiProperty({ description: 'Nome do arquivo' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: 'Conteudo em base64' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
