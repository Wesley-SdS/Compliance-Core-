import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService, DatabaseService, ComplianceLogger } from '@compliancecore/sdk';

interface VektusCallbackPayload {
  fileId: string;
  status: 'completed' | 'failed';
  extractedData?: {
    fornecedor?: string;
    valorTotal?: number;
    itens?: Array<{
      descricao: string;
      quantidade?: number;
      unidade?: string;
      lote?: string;
    }>;
  };
}

@Injectable()
export class ProcessarOCRCallbackUseCase {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('ProcessarOCRCallbackUseCase');
  }

  async execute(payload: VektusCallbackPayload) {
    const { fileId, status, extractedData } = payload;

    if (status === 'failed') {
      await this.db.query(
        `UPDATE notas_fiscais SET status_ocr = 'ERRO', updated_at = NOW() WHERE vektus_file_id = $1`,
        [fileId],
      );
      return { received: true, status: 'failed' };
    }

    if (status !== 'completed' || !extractedData) {
      return { received: true, status: 'ignored' };
    }

    const nf = await this.db.queryOne(
      `SELECT * FROM notas_fiscais WHERE vektus_file_id = $1`,
      [fileId],
    );

    if (!nf) {
      this.logger.warn(`NF not found for vektus file ${fileId}`);
      return { received: true, status: 'nf_not_found' };
    }

    // Wrap NF update + material creation + gasto update in a transaction
    const createdMaterials: string[] = [];
    await this.db.transaction(async (query) => {
      // Update nota fiscal with extracted data
      await query(
        `UPDATE notas_fiscais SET status_ocr = 'CONCLUIDO', dados_extraidos = $1, fornecedor = $2, valor_total = $3, itens = $4, updated_at = NOW() WHERE id = $5`,
        [
          JSON.stringify(extractedData),
          extractedData.fornecedor || null,
          extractedData.valorTotal || null,
          JSON.stringify(extractedData.itens || []),
          nf.id,
        ],
      );

      // Create material entries from extracted items
      if (extractedData.itens?.length) {
        for (const item of extractedData.itens) {
          const matId = ulid();
          await query(
            `INSERT INTO materiais (id, obra_id, nome, quantidade, unidade, fornecedor, nota_fiscal_id, lote, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
            [matId, nf.obra_id, item.descricao, item.quantidade || 1, item.unidade || 'un', extractedData.fornecedor, nf.id, item.lote || null],
          );
          createdMaterials.push(matId);
        }
      }

      // Update gasto_atual on obra
      const [totalGasto] = await query(
        `SELECT COALESCE(SUM(valor_total), 0) as total FROM notas_fiscais WHERE obra_id = $1 AND status_ocr = 'CONCLUIDO'`,
        [nf.obra_id],
      );
      if (totalGasto) {
        await query(
          `UPDATE obras SET gasto_atual = $1, updated_at = NOW() WHERE id = $2`,
          [parseFloat(totalGasto.total), nf.obra_id],
        );
      }
    });

    await this.eventStore.append(nf.obra_id, 'obra', 'NF_PROCESSADA', {
      notaFiscalId: nf.id, vektusFileId: fileId,
      itensCount: extractedData.itens?.length || 0,
      valorTotal: extractedData.valorTotal,
      materiaisCriados: createdMaterials,
    }, { actorId: 'vektus-webhook', actorRole: 'system', ip: '0.0.0.0', correlationId: ulid() });

    this.logger.log(`NF ${nf.id} processada: ${extractedData.itens?.length || 0} itens`);

    return { received: true, status: 'processed', materiaisCriados: createdMaterials.length };
  }
}
