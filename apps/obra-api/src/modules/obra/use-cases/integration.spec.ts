import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CriarObraUseCase } from './criar-obra.use-case';
import { RegistrarNotaFiscalUseCase } from './registrar-nota-fiscal.use-case';
import { ProcessarOCRCallbackUseCase } from './processar-ocr-callback.use-case';
import { TransferirMaterialUseCase } from './transferir-material.use-case';
import { TipoObra } from '../obra.dto';

/**
 * Integration test: full flow
 * criar obra → upload NF → webhook OCR → materiais rastreáveis → score calculado → dossiê
 */

// Shared in-memory state to simulate database
const dbStore: Record<string, any[]> = {
  obras: [],
  notas_fiscais: [],
  materiais: [],
  events: [],
};

function resetDb() {
  dbStore.obras = [];
  dbStore.notas_fiscais = [];
  dbStore.materiais = [];
  dbStore.events = [];
}

// Simulated DB that stores/retrieves from dbStore
const mockDb = {
  query: vi.fn(async (sql: string, params: any[]) => {
    if (sql.includes('INSERT INTO obras')) {
      dbStore.obras.push({
        id: params[0], nome: params[1], endereco: params[2],
        responsavel: params[3], tipo_obra: params[4], area_m2: params[5],
        numero_pavimentos: params[6], inicio_previsao: params[7], fim_previsao: params[8],
        cnpj_construtora: params[9], crea_responsavel: params[10], status: 'PLANEJAMENTO',
        gasto_atual: 0,
      });
      return [];
    }
    if (sql.includes('INSERT INTO notas_fiscais')) {
      dbStore.notas_fiscais.push({
        id: params[0], obra_id: params[1], imagem_url: params[2],
        status_ocr: 'PENDENTE', vektus_file_id: params[3],
      });
      return [];
    }
    if (sql.includes('INSERT INTO materiais')) {
      dbStore.materiais.push({
        id: params[0], obra_id: params[1], nome: params[2],
        quantidade: String(params[3]), unidade: params[4],
        fornecedor: params[5], nota_fiscal_id: params[6], lote: params[7],
      });
      return [];
    }
    if (sql.includes('UPDATE notas_fiscais SET status_ocr = \'CONCLUIDO\'')) {
      const nf = dbStore.notas_fiscais.find(n => n.id === params[4]);
      if (nf) {
        nf.status_ocr = 'CONCLUIDO';
        nf.dados_extraidos = params[0];
        nf.fornecedor = params[1];
        nf.valor_total = params[2];
        nf.itens = params[3];
      }
      return [];
    }
    if (sql.includes('UPDATE obras SET gasto_atual')) {
      const obra = dbStore.obras.find(o => o.id === params[1]);
      if (obra) obra.gasto_atual = params[0];
      return [];
    }
    if (sql.includes('UPDATE materiais SET quantidade')) {
      const mat = dbStore.materiais.find(m => m.id === params[1]);
      if (mat) mat.quantidade = String(params[0]);
      return [];
    }
    return [];
  }),
  queryOne: vi.fn(async (sql: string, params: any[]) => {
    if (sql.includes('FROM obras WHERE id')) {
      return dbStore.obras.find(o => o.id === params[0]) || null;
    }
    if (sql.includes('FROM obras WHERE') && sql.includes('SELECT id')) {
      return dbStore.obras.find(o => o.id === params[0]) || null;
    }
    if (sql.includes('FROM notas_fiscais WHERE vektus_file_id')) {
      return dbStore.notas_fiscais.find(n => n.vektus_file_id === params[0]) || null;
    }
    if (sql.includes('FROM materiais WHERE id')) {
      return dbStore.materiais.find(m => m.id === params[0]) || null;
    }
    if (sql.includes('COALESCE(SUM(valor_total)')) {
      const total = dbStore.notas_fiscais
        .filter(n => n.obra_id === params[0] && n.status_ocr === 'CONCLUIDO')
        .reduce((sum: number, n: any) => sum + (parseFloat(n.valor_total) || 0), 0);
      return { total: String(total) };
    }
    return null;
  }),
};

const mockEventStore = {
  append: vi.fn(async (_id: string, _type: string, eventType: string, payload: any) => {
    dbStore.events.push({ eventType, payload, timestamp: new Date() });
  }),
};

const mockVektus = {
  ingest: vi.fn(async () => ({ fileId: 'vektus-integration-test', status: 'processing' })),
};

const mockLogger = { setContext: vi.fn(), log: vi.fn(), warn: vi.fn(), error: vi.fn() };

describe('Integration: Obra → NF → OCR → Materiais → Transfer', () => {
  let criarObra: CriarObraUseCase;
  let registrarNF: RegistrarNotaFiscalUseCase;
  let processarOCR: ProcessarOCRCallbackUseCase;
  let transferirMaterial: TransferirMaterialUseCase;

  let obraId: string;

  beforeEach(() => {
    vi.clearAllMocks();
    resetDb();

    criarObra = new CriarObraUseCase(mockDb as any, mockEventStore as any, mockLogger as any);
    registrarNF = new RegistrarNotaFiscalUseCase(mockDb as any, mockEventStore as any, mockVektus as any, mockLogger as any);
    processarOCR = new ProcessarOCRCallbackUseCase(mockDb as any, mockEventStore as any);
    transferirMaterial = new TransferirMaterialUseCase(mockDb as any, mockEventStore as any, mockLogger as any);
  });

  it('should complete the full flow: create → upload NF → OCR callback → create materials → transfer', async () => {
    // Step 1: Create obra
    const obra = await criarObra.execute({
      nome: 'Edificio Compliance Tower',
      endereco: 'Av. Paulista, 1000',
      responsavel: 'Eng. Ana Costa',
      tipoObra: TipoObra.COMERCIAL,
      areaM2: 5000,
      numeroPavimentos: 20,
      inicioPrevisao: '2026-04-01',
      fimPrevisao: '2028-12-31',
    }, 'actor-admin');

    obraId = obra.id;
    expect(obra).toBeDefined();
    expect(obra.status).toBe('PLANEJAMENTO');
    expect(dbStore.events.some(e => e.eventType === 'OBRA_CREATED')).toBe(true);

    // Step 2: Upload NF (nota fiscal)
    const nfResult = await registrarNF.execute(
      obraId,
      { imagemUrl: 'https://storage.example.com/nf/scan001.jpg' },
      'actor-admin',
    );

    expect(nfResult.status).toBe('PENDENTE');
    expect(nfResult.vektusFileId).toBe('vektus-integration-test');
    expect(dbStore.notas_fiscais).toHaveLength(1);
    expect(dbStore.events.some(e => e.eventType === 'NF_UPLOADED')).toBe(true);

    // Step 3: Simulate Vektus OCR callback
    const ocrResult = await processarOCR.execute({
      fileId: 'vektus-integration-test',
      status: 'completed',
      extractedData: {
        fornecedor: 'Construmateriais LTDA',
        valorTotal: 75000,
        itens: [
          { descricao: 'Aco CA-50 12.5mm', quantidade: 200, unidade: 'barra', lote: 'ACO-2026-A' },
          { descricao: 'Concreto FCK 30', quantidade: 50, unidade: 'm3' },
          { descricao: 'Forma Metalica', quantidade: 30, unidade: 'un', lote: 'FM-001' },
        ],
      },
    });

    expect(ocrResult.status).toBe('processed');
    expect(ocrResult.materiaisCriados).toBe(3);

    // Verify materials were created
    expect(dbStore.materiais).toHaveLength(3);
    expect(dbStore.materiais[0].nome).toBe('Aco CA-50 12.5mm');
    expect(dbStore.materiais[0].fornecedor).toBe('Construmateriais LTDA');
    expect(dbStore.materiais[0].obra_id).toBe(obraId);

    // Verify gasto_atual was updated
    const obraAfterOCR = dbStore.obras.find(o => o.id === obraId);
    expect(obraAfterOCR!.gasto_atual).toBe(75000);

    // Verify NF_PROCESSADA event
    expect(dbStore.events.some(e => e.eventType === 'NF_PROCESSADA')).toBe(true);

    // Step 4: Create second obra for transfer
    const obra2 = await criarObra.execute({
      nome: 'Residencial Parque Verde',
      endereco: 'Rua Augusta, 500',
      responsavel: 'Eng. Carlos Lima',
      tipoObra: TipoObra.RESIDENCIAL,
      areaM2: 2000,
      numeroPavimentos: 8,
      inicioPrevisao: '2026-06-01',
      fimPrevisao: '2028-06-01',
    }, 'actor-admin');

    // Step 5: Transfer material between obras
    const steelMat = dbStore.materiais.find(m => m.nome === 'Aco CA-50 12.5mm')!;

    const transferResult = await transferirMaterial.execute({
      materialId: steelMat.id,
      obraOrigemId: obraId,
      obraDestinoId: obra2.id,
      quantidade: 50,
    }, 'actor-admin');

    expect(transferResult.quantidade).toBe(50);

    // Verify stock was debited from origin
    const originMat = dbStore.materiais.find(m => m.id === steelMat.id)!;
    expect(parseFloat(originMat.quantidade)).toBe(150); // 200 - 50

    // Verify new entry at destination
    const destMat = dbStore.materiais.find(m => m.id === transferResult.materialDestino)!;
    expect(destMat.obra_id).toBe(obra2.id);
    expect(parseFloat(destMat.quantidade)).toBe(50);
    expect(destMat.nome).toBe('Aco CA-50 12.5mm');
    expect(destMat.lote).toBe('ACO-2026-A'); // lot traceability preserved

    // Verify MATERIAL_TRANSFERIDO event
    expect(dbStore.events.some(e => e.eventType === 'MATERIAL_TRANSFERIDO')).toBe(true);

    // Final assertion: full event chain
    const eventTypes = dbStore.events.map(e => e.eventType);
    expect(eventTypes).toEqual([
      'OBRA_CREATED',      // obra 1
      'NF_UPLOADED',       // NF for obra 1
      'NF_PROCESSADA',     // OCR completed
      'OBRA_CREATED',      // obra 2
      'MATERIAL_TRANSFERIDO', // transfer between obras
    ]);
  });

  it('should prevent transfer when stock is insufficient', async () => {
    // Create obra and add material via OCR
    await criarObra.execute({
      nome: 'Obra Teste',
      endereco: 'Rua Teste, 1',
      responsavel: 'Eng. Teste',
      tipoObra: TipoObra.REFORMA,
      areaM2: 100,
      numeroPavimentos: 1,
      inicioPrevisao: '2026-04-01',
      fimPrevisao: '2026-12-01',
    }, 'actor-1');

    const obra2 = await criarObra.execute({
      nome: 'Obra Destino',
      endereco: 'Rua Destino, 2',
      responsavel: 'Eng. Dest',
      tipoObra: TipoObra.RESIDENCIAL,
      areaM2: 200,
      numeroPavimentos: 2,
      inicioPrevisao: '2026-04-01',
      fimPrevisao: '2027-01-01',
    }, 'actor-1');

    // Manually add a material with small quantity
    dbStore.materiais.push({
      id: 'mat-small',
      obra_id: dbStore.obras[0].id,
      nome: 'Prego 17x27',
      quantidade: '5',
      unidade: 'kg',
      fornecedor: 'Ferragens X',
      nota_fiscal_id: null,
      lote: null,
    });

    await expect(
      transferirMaterial.execute({
        materialId: 'mat-small',
        obraOrigemId: dbStore.obras[0].id,
        obraDestinoId: obra2.id,
        quantidade: 10, // more than available
      }, 'actor-1'),
    ).rejects.toThrow('Estoque insuficiente');
  });
});
