import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsIn,
  ValidateNested,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

const VALID_DOC_CATEGORIES = [
  'alvara', 'licenca_sanitaria', 'registro_anvisa', 'pop',
  'tcle', 'contrato', 'laudo_tecnico', 'certificado_treinamento',
  'manual_equipamento', 'nota_fiscal', 'foto_antes_depois',
  'pgrss', 'laudo_pgrss', 'outro',
] as const;

export class ResponsavelTecnicoDto {
  @ApiProperty({ description: 'Nome do responsavel tecnico' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiPropertyOptional({ description: 'CRM do responsavel tecnico' })
  @IsString()
  @IsOptional()
  crm?: string;

  @ApiPropertyOptional({ description: 'CRO do responsavel tecnico' })
  @IsString()
  @IsOptional()
  cro?: string;

  @ApiProperty({ description: 'Especialidade' })
  @IsString()
  @IsNotEmpty()
  especialidade: string;
}

export class EquipamentoDto {
  @ApiProperty({ description: 'Nome do equipamento' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'Fabricante' })
  @IsString()
  @IsNotEmpty()
  fabricante: string;

  @ApiPropertyOptional({ description: 'Numero de registro Anvisa' })
  @IsString()
  @IsOptional()
  registroAnvisa?: string;

  @ApiPropertyOptional({ description: 'Data da ultima calibracao' })
  @IsDateString()
  @IsOptional()
  ultimaCalibracao?: string;
}

export class ProfissionalDto {
  @ApiProperty({ description: 'Nome do profissional' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'Funcao' })
  @IsString()
  @IsNotEmpty()
  funcao: string;

  @ApiPropertyOptional({ description: 'Registro profissional (CRM/CRO/COREN)' })
  @IsString()
  @IsOptional()
  registro?: string;

  @ApiProperty({ description: 'Treinamento valido' })
  @IsBoolean()
  treinamentoValido: boolean;

  @ApiPropertyOptional({ description: 'Data do ultimo treinamento' })
  @IsDateString()
  @IsOptional()
  ultimoTreinamento?: string;
}

export class CreateClinicaDto {
  @ApiProperty({ description: 'Nome da clinica' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  nome: string;

  @ApiProperty({ description: 'CNPJ da clinica' })
  @IsString()
  @IsNotEmpty()
  cnpj: string;

  @ApiProperty({ description: 'Endereco completo' })
  @IsString()
  @IsNotEmpty()
  endereco: string;

  @ApiPropertyOptional({ description: 'Telefone de contato' })
  @IsString()
  @IsOptional()
  telefone?: string;

  @ApiPropertyOptional({ description: 'Email de contato' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Responsavel tecnico' })
  @ValidateNested()
  @Type(() => ResponsavelTecnicoDto)
  @IsOptional()
  responsavelTecnico?: ResponsavelTecnicoDto;

  @ApiPropertyOptional({
    description: 'Equipamentos da clinica',
    type: [EquipamentoDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipamentoDto)
  @IsOptional()
  equipamentos?: EquipamentoDto[];

  @ApiPropertyOptional({
    description: 'Profissionais da clinica',
    type: [ProfissionalDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfissionalDto)
  @IsOptional()
  profissionais?: ProfissionalDto[];

  @ApiPropertyOptional({ description: 'Versao do termo LGPD' })
  @IsString()
  @IsOptional()
  lgpdTermVersion?: string;

  @ApiPropertyOptional({ description: 'Termos LGPD aceitos' })
  @IsBoolean()
  @IsOptional()
  lgpdTermAccepted?: boolean;
}

export class UpdateClinicaDto {
  @ApiPropertyOptional({ description: 'Nome da clinica' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  nome?: string;

  @ApiPropertyOptional({ description: 'Endereco completo' })
  @IsString()
  @IsOptional()
  endereco?: string;

  @ApiPropertyOptional({ description: 'Telefone de contato' })
  @IsString()
  @IsOptional()
  telefone?: string;

  @ApiPropertyOptional({ description: 'Email de contato' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Responsavel tecnico' })
  @ValidateNested()
  @Type(() => ResponsavelTecnicoDto)
  @IsOptional()
  responsavelTecnico?: ResponsavelTecnicoDto;

  @ApiPropertyOptional({
    description: 'Equipamentos da clinica',
    type: [EquipamentoDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipamentoDto)
  @IsOptional()
  equipamentos?: EquipamentoDto[];

  @ApiPropertyOptional({
    description: 'Profissionais da clinica',
    type: [ProfissionalDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfissionalDto)
  @IsOptional()
  profissionais?: ProfissionalDto[];

  @ApiPropertyOptional({ description: 'Versao do termo LGPD' })
  @IsString()
  @IsOptional()
  lgpdTermVersion?: string;

  @ApiPropertyOptional({ description: 'Termos LGPD aceitos' })
  @IsBoolean()
  @IsOptional()
  lgpdTermAccepted?: boolean;
}

export class UploadDocumentDto {
  @ApiProperty({ description: 'Nome do arquivo' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: 'Chave do arquivo no storage' })
  @IsString()
  @IsNotEmpty()
  fileKey: string;

  @ApiProperty({ description: 'Tamanho do arquivo em bytes' })
  @IsNumber()
  @Min(1)
  fileSize: number;

  @ApiProperty({ description: 'Tipo MIME do arquivo' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({
    description: 'Categoria do documento',
    enum: [
      'alvara', 'licenca_sanitaria', 'registro_anvisa', 'pop',
      'tcle', 'contrato', 'laudo_tecnico', 'certificado_treinamento',
      'manual_equipamento', 'nota_fiscal', 'foto_antes_depois', 'outro',
    ],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(VALID_DOC_CATEGORIES)
  category: string;

  @ApiPropertyOptional({ description: 'Data de expiracao do documento' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Tags do documento' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class SubmitChecklistDto {
  @ApiProperty({ description: 'Respostas do checklist' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistResponseItemDto)
  responses: ChecklistResponseItemDto[];
}

export class ChecklistResponseItemDto {
  @ApiProperty({ description: 'ID do item do checklist' })
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({
    description: 'Resposta',
    enum: ['SIM', 'NAO', 'NA', 'PARCIAL'],
  })
  @IsString()
  @IsNotEmpty()
  answer: 'SIM' | 'NAO' | 'NA' | 'PARCIAL';

  @ApiPropertyOptional({ description: 'Observacoes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'IDs de evidencias' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  evidenceIds?: string[];
}

export class PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Pagina', default: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Itens por pagina', default: 20 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
