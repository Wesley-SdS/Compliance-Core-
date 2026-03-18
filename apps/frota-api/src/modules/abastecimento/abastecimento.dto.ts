import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAbastecimentoDto {
  @ApiProperty({ description: 'ID do veiculo' })
  @IsString()
  @IsNotEmpty()
  veiculoId: string;

  @ApiProperty({ description: 'Litros abastecidos' })
  @IsNumber()
  @Min(0)
  litros: number;

  @ApiProperty({ description: 'Valor por litro' })
  @IsNumber()
  @Min(0)
  valorLitro: number;

  @ApiProperty({ description: 'Total pago' })
  @IsNumber()
  @Min(0)
  total: number;

  @ApiPropertyOptional({ description: 'Nome do posto' })
  @IsOptional()
  @IsString()
  posto?: string;

  @ApiProperty({ description: 'Km do veiculo no momento' })
  @IsNumber()
  @Min(0)
  km: number;
}
