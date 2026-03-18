import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsNumber, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AnalitoTemplateDto {
  @ApiProperty() @IsString() @IsNotEmpty() analito: string;
  @ApiProperty() @IsString() @IsNotEmpty() unidade: string;
  @ApiPropertyOptional() @IsOptional() @IsString() valorReferenciaHomem?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() valorReferenciaMulher?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() valorReferenciaCrianca?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() limiteCriticoAlto?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() limiteCriticoBaixo?: number;
}

export class CreateTemplateDto {
  @ApiProperty() @IsString() @MinLength(3) nome: string;
  @ApiProperty() @IsString() @IsNotEmpty() tipoExame: string;
  @ApiPropertyOptional() @IsOptional() @IsString() laboratorioId?: string;
  @ApiProperty({ type: [AnalitoTemplateDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => AnalitoTemplateDto)
  analitos: AnalitoTemplateDto[];
}

export class UpdateTemplateDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(3) nome?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tipoExame?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => AnalitoTemplateDto)
  analitos?: AnalitoTemplateDto[];
}
