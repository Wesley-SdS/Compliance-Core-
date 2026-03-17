import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateProcedimentoDto {
  @ApiProperty({ description: 'Nome do procedimento' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'Tipo do procedimento (ex: botox, preenchimento, laser)' })
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @ApiProperty({ description: 'Descricao detalhada do procedimento' })
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @ApiPropertyOptional({ description: 'Lista de riscos associados', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  riscos?: string[];

  @ApiPropertyOptional({ description: 'Requisitos do profissional', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requisitosProfissional?: string[];

  @ApiPropertyOptional({ description: 'Equipamentos necessarios', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipamentosNecessarios?: string[];

  @ApiPropertyOptional({ description: 'Documentos obrigatorios', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentosObrigatorios?: string[];
}

export class UpdateProcedimentoDto extends PartialType(CreateProcedimentoDto) {
  @ApiPropertyOptional({ description: 'ID do POP vinculado' })
  @IsOptional()
  @IsString()
  popId?: string;

  @ApiPropertyOptional({ description: 'Data de atualizacao do POP' })
  @IsOptional()
  @IsDateString()
  popUpdatedAt?: string;

  @ApiPropertyOptional({ description: 'Se o procedimento esta ativo' })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
