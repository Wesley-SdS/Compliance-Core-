import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ChecklistItemDto {
  @ApiProperty({ description: 'Nome do item verificado' })
  @IsString()
  @IsNotEmpty()
  item: string;

  @ApiProperty({ description: 'Se esta conforme (ok/nok)' })
  @IsString()
  @IsNotEmpty()
  status: string;
}

export class CreateChecklistDto {
  @ApiProperty({ description: 'ID do veiculo' })
  @IsString()
  @IsNotEmpty()
  veiculoId: string;

  @ApiProperty({ description: 'ID do motorista' })
  @IsString()
  @IsNotEmpty()
  motoristaId: string;

  @ApiProperty({ description: 'Itens do checklist', type: [ChecklistItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  items: ChecklistItemDto[];
}
