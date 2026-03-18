import { IsArray, IsNumber, IsString, IsNotEmpty, ValidateNested, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class EtapaReguaDto {
  @ApiProperty({ description: 'Dias antes/apos vencimento (negativo = antes)' })
  @IsNumber()
  dias: number;

  @ApiProperty({ description: 'Canal de comunicacao (email, sms, whatsapp, carta)' })
  @IsString()
  @IsNotEmpty()
  canal: string;

  @ApiProperty({ description: 'Template da mensagem' })
  @IsString()
  @IsNotEmpty()
  template: string;
}

export class UpdateReguaDto {
  @ApiProperty({ type: [EtapaReguaDto], description: 'Etapas da regua de cobranca' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EtapaReguaDto)
  etapas: EtapaReguaDto[];
}

export class ExecutarEtapaDto {
  @ApiProperty({ description: 'ID do contrato' })
  @IsString()
  @IsNotEmpty()
  contratoId: string;

  @ApiProperty({ description: 'Indice da etapa na regua' })
  @IsNumber()
  @Min(0)
  etapaIndex: number;
}
