import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateManutencaoDto {
  @ApiProperty({ description: 'ID do veiculo' })
  @IsString()
  @IsNotEmpty()
  veiculoId: string;

  @ApiProperty({ description: 'Tipo da manutencao (PREVENTIVA, CORRETIVA, PREDITIVA)' })
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @ApiProperty({ description: 'Data da manutencao' })
  @IsDateString()
  data: string;

  @ApiProperty({ description: 'Km do veiculo no momento' })
  @IsNumber()
  @Min(0)
  km: number;

  @ApiProperty({ description: 'Custo da manutencao' })
  @IsNumber()
  @Min(0)
  custo: number;

  @ApiPropertyOptional({ description: 'Nome do fornecedor' })
  @IsOptional()
  @IsString()
  fornecedor?: string;

  @ApiPropertyOptional({ description: 'Descricao da manutencao' })
  @IsOptional()
  @IsString()
  descricao?: string;
}
