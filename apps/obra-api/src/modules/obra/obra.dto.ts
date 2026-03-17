import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsEnum, Min, IsIn, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum TipoObra {
  RESIDENCIAL = 'RESIDENCIAL',
  COMERCIAL = 'COMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL',
  INFRAESTRUTURA = 'INFRAESTRUTURA',
  REFORMA = 'REFORMA',
  MISTA = 'MISTA',
}

export class CreateObraDto {
  @ApiProperty({ description: 'Nome da obra' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'Endereco da obra' })
  @IsString()
  @IsNotEmpty()
  endereco: string;

  @ApiProperty({ description: 'Responsavel tecnico' })
  @IsString()
  @IsNotEmpty()
  responsavel: string;

  @ApiProperty({ enum: TipoObra, description: 'Tipo da obra' })
  @IsEnum(TipoObra)
  tipoObra: TipoObra;

  @ApiProperty({ description: 'Area em metros quadrados' })
  @IsNumber()
  @Min(0)
  areaM2: number;

  @ApiProperty({ description: 'Numero de pavimentos' })
  @IsNumber()
  @Min(0)
  numeroPavimentos: number;

  @ApiProperty({ description: 'Data prevista de inicio' })
  @IsDateString()
  inicioPrevisao: string;

  @ApiProperty({ description: 'Data prevista de conclusao' })
  @IsDateString()
  fimPrevisao: string;

  @ApiPropertyOptional({ description: 'CNPJ da construtora' })
  @IsOptional()
  @IsString()
  cnpjConstrutora?: string;

  @ApiPropertyOptional({ description: 'Numero do CREA do responsavel' })
  @IsOptional()
  @IsString()
  creaResponsavel?: string;
}

export class UpdateObraDto extends PartialType(CreateObraDto) {}

export class UploadNotaFiscalDto {
  @ApiProperty({ description: 'URL da imagem da nota fiscal' })
  @IsString()
  @IsNotEmpty()
  imagemUrl: string;
}

export class UploadDocumentoDto {
  @ApiProperty({ description: 'Nome do documento' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'Categoria do documento', enum: ['ALVARA', 'ART_RRT', 'LICENCA_AMBIENTAL', 'SEGURO', 'NR_TREINAMENTO', 'DIARIO_OBRA', 'EPI_REGISTRO', 'PCMSO_PPRA', 'CREA_REGISTRO', 'PROJETO_APROVADO', 'HABITE_SE', 'OUTRO'] })
  @IsString()
  @IsIn(['ALVARA', 'ART_RRT', 'LICENCA_AMBIENTAL', 'SEGURO', 'NR_TREINAMENTO', 'DIARIO_OBRA', 'EPI_REGISTRO', 'PCMSO_PPRA', 'CREA_REGISTRO', 'PROJETO_APROVADO', 'HABITE_SE', 'OUTRO'])
  categoria: string;

  @ApiPropertyOptional({ description: 'Data de validade' })
  @IsOptional()
  @IsDateString()
  dataValidade?: string;

  @ApiPropertyOptional({ description: 'Chave do arquivo no storage' })
  @IsOptional()
  @IsString()
  fileKey?: string;

  @ApiPropertyOptional({ description: 'Tamanho do arquivo' })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional({ description: 'MIME type' })
  @IsOptional()
  @IsString()
  mimeType?: string;
}

export class TransferirMaterialDto {
  @ApiProperty({ description: 'ID do material' })
  @IsString()
  @IsNotEmpty()
  materialId: string;

  @ApiProperty({ description: 'ID da obra de origem' })
  @IsString()
  @IsNotEmpty()
  obraOrigemId: string;

  @ApiProperty({ description: 'ID da obra de destino' })
  @IsString()
  @IsNotEmpty()
  obraDestinoId: string;

  @ApiProperty({ description: 'Quantidade a transferir' })
  @IsNumber()
  @Min(0.01)
  quantidade: number;
}

export class ChecklistResponseDto {
  @ApiProperty() @IsString() @IsNotEmpty() itemId: string;
  @ApiProperty({ enum: ['SIM', 'NAO', 'NA', 'PARCIAL'] }) @IsString() answer: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) evidenceIds?: string[];
}

export class SubmitChecklistDto {
  @ApiProperty({ description: 'Respostas do checklist', type: [ChecklistResponseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistResponseDto)
  responses: ChecklistResponseDto[];
}
