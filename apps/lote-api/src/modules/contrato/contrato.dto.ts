import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SistemaAmortizacao {
  PRICE = 'PRICE',
  SAC = 'SAC',
}

export enum ContratoStatus {
  ATIVO = 'ATIVO',
  QUITADO = 'QUITADO',
  DISTRATADO = 'DISTRATADO',
  INADIMPLENTE = 'INADIMPLENTE',
}

export enum ParcelaStatus {
  PENDENTE = 'PENDENTE',
  PAGO = 'PAGO',
  ATRASADO = 'ATRASADO',
}

export class CreateContratoDto {
  @ApiProperty({ description: 'ID do loteamento' })
  @IsString()
  @IsNotEmpty()
  loteamentoId: string;

  @ApiProperty({ description: 'ID do lote' })
  @IsString()
  @IsNotEmpty()
  loteId: string;

  @ApiProperty({ description: 'ID do comprador' })
  @IsString()
  @IsNotEmpty()
  compradorId: string;

  @ApiProperty({ description: 'Valor total do contrato' })
  @IsNumber()
  @Min(0)
  valorTotal: number;

  @ApiProperty({ description: 'Valor da entrada' })
  @IsNumber()
  @Min(0)
  valorEntrada: number;

  @ApiProperty({ description: 'Numero de parcelas' })
  @IsNumber()
  @Min(1)
  numeroParcelas: number;

  @ApiProperty({ description: 'Taxa de juros mensal (em %)' })
  @IsNumber()
  @Min(0)
  taxaJurosMensal: number;

  @ApiProperty({ enum: SistemaAmortizacao, description: 'Sistema de amortizacao (PRICE ou SAC)' })
  @IsEnum(SistemaAmortizacao)
  sistema: SistemaAmortizacao;
}

export class UpdateContratoDto {
  @ApiPropertyOptional({ enum: ContratoStatus, description: 'Status do contrato' })
  @IsOptional()
  @IsEnum(ContratoStatus)
  status?: ContratoStatus;

  @ApiPropertyOptional({ description: 'Observacoes' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class RegistrarPagamentoDto {
  @ApiProperty({ description: 'Numero da parcela' })
  @IsNumber()
  @Min(1)
  parcelaNumero: number;

  @ApiProperty({ description: 'Valor pago' })
  @IsNumber()
  @Min(0)
  valorPago: number;

  @ApiProperty({ description: 'Data do pagamento' })
  @IsDateString()
  dataPagamento: string;
}

export class GerarBoletoDto {
  @ApiProperty({ description: 'Numero da parcela' })
  @IsNumber()
  @Min(1)
  parcelaNumero: number;
}
