import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegistrarFotoDto {
  @ApiProperty() @IsString() @IsNotEmpty() obraId: string;
  @ApiProperty() @IsString() @IsNotEmpty() url: string;
  @ApiProperty() @IsNumber() latitude: number;
  @ApiProperty() @IsNumber() longitude: number;
  @ApiPropertyOptional() @IsOptional() @IsString() etapaId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descricao?: string;
}
