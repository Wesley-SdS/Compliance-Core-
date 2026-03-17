import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { TransferirMaterialUseCase } from './transferir-material.use-case';

const mockDb = {
  query: vi.fn(),
  queryOne: vi.fn(),
};
const mockEventStore = { append: vi.fn() };
const mockLogger = { setContext: vi.fn(), log: vi.fn(), warn: vi.fn(), error: vi.fn() };

describe('TransferirMaterialUseCase', () => {
  let useCase: TransferirMaterialUseCase;

  const validDto = {
    materialId: 'mat-1',
    obraOrigemId: 'obra-1',
    obraDestinoId: 'obra-2',
    quantidade: 30,
  };

  const materialRow = {
    id: 'mat-1',
    obra_id: 'obra-1',
    nome: 'Cimento CP-II',
    quantidade: '100',
    unidade: 'saco',
    fornecedor: 'Materiais ABC',
    nota_fiscal_id: 'nf-1',
    lote: 'L2026-001',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new TransferirMaterialUseCase(mockDb as any, mockEventStore as any, mockLogger as any);
  });

  it('should transfer material successfully', async () => {
    mockDb.queryOne
      .mockResolvedValueOnce(materialRow) // material lookup
      .mockResolvedValueOnce({ id: 'obra-2' }); // destino lookup
    mockDb.query.mockResolvedValue([]);
    mockEventStore.append.mockResolvedValue(undefined);

    const result = await useCase.execute(validDto, 'actor-1');

    expect(result.materialOrigem).toBe('mat-1');
    expect(result.materialDestino).toBeDefined();
    expect(result.quantidade).toBe(30);
  });

  it('should debit quantity from origin material', async () => {
    mockDb.queryOne
      .mockResolvedValueOnce(materialRow)
      .mockResolvedValueOnce({ id: 'obra-2' });
    mockDb.query.mockResolvedValue([]);
    mockEventStore.append.mockResolvedValue(undefined);

    await useCase.execute(validDto, 'actor-1');

    const updateCall = mockDb.query.mock.calls.find(
      (call: any) => call[0].includes('UPDATE materiais SET quantidade'),
    );
    expect(updateCall).toBeDefined();
    expect(updateCall![1][0]).toBe(70); // 100 - 30
    expect(updateCall![1][1]).toBe('mat-1');
  });

  it('should create new material entry at destination', async () => {
    mockDb.queryOne
      .mockResolvedValueOnce(materialRow)
      .mockResolvedValueOnce({ id: 'obra-2' });
    mockDb.query.mockResolvedValue([]);
    mockEventStore.append.mockResolvedValue(undefined);

    await useCase.execute(validDto, 'actor-1');

    const insertCall = mockDb.query.mock.calls.find(
      (call: any) => call[0].includes('INSERT INTO materiais'),
    );
    expect(insertCall).toBeDefined();
    expect(insertCall![1]).toContain('obra-2'); // destination obra
    expect(insertCall![1]).toContain('Cimento CP-II');
    expect(insertCall![1]).toContain(30); // transferred qty
    expect(insertCall![1]).toContain('saco'); // same unit
    expect(insertCall![1]).toContain('L2026-001'); // same lot
  });

  it('should throw when material does not exist', async () => {
    mockDb.queryOne.mockResolvedValue(null);

    await expect(
      useCase.execute(validDto, 'actor-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw when stock is insufficient', async () => {
    mockDb.queryOne.mockResolvedValueOnce({ ...materialRow, quantidade: '20' });

    await expect(
      useCase.execute(validDto, 'actor-1'),
    ).rejects.toThrow('Estoque insuficiente');
  });

  it('should throw when destination obra does not exist', async () => {
    mockDb.queryOne
      .mockResolvedValueOnce(materialRow)
      .mockResolvedValueOnce(null); // destino not found

    await expect(
      useCase.execute(validDto, 'actor-1'),
    ).rejects.toThrow('Obra destino');
  });

  it('should transfer exact available quantity (full transfer)', async () => {
    const exactDto = { ...validDto, quantidade: 100 };
    mockDb.queryOne
      .mockResolvedValueOnce(materialRow) // has 100
      .mockResolvedValueOnce({ id: 'obra-2' });
    mockDb.query.mockResolvedValue([]);
    mockEventStore.append.mockResolvedValue(undefined);

    await useCase.execute(exactDto, 'actor-1');

    const updateCall = mockDb.query.mock.calls.find(
      (call: any) => call[0].includes('UPDATE materiais SET quantidade'),
    );
    expect(updateCall![1][0]).toBe(0); // fully transferred
  });

  it('should append MATERIAL_TRANSFERIDO event', async () => {
    mockDb.queryOne
      .mockResolvedValueOnce(materialRow)
      .mockResolvedValueOnce({ id: 'obra-2' });
    mockDb.query.mockResolvedValue([]);
    mockEventStore.append.mockResolvedValue(undefined);

    await useCase.execute(validDto, 'actor-1');

    expect(mockEventStore.append).toHaveBeenCalledWith(
      'obra-1', 'obra', 'MATERIAL_TRANSFERIDO',
      expect.objectContaining({
        materialId: 'mat-1',
        obraOrigem: 'obra-1',
        obraDestino: 'obra-2',
        quantidade: 30,
      }),
      expect.objectContaining({ actorId: 'actor-1' }),
    );
  });

  it('should handle fractional quantities', async () => {
    const fractionalDto = { ...validDto, quantidade: 33.5 };
    mockDb.queryOne
      .mockResolvedValueOnce({ ...materialRow, quantidade: '100.5' })
      .mockResolvedValueOnce({ id: 'obra-2' });
    mockDb.query.mockResolvedValue([]);
    mockEventStore.append.mockResolvedValue(undefined);

    await useCase.execute(fractionalDto, 'actor-1');

    const updateCall = mockDb.query.mock.calls.find(
      (call: any) => call[0].includes('UPDATE materiais SET quantidade'),
    );
    expect(updateCall![1][0]).toBe(67); // 100.5 - 33.5
  });
});
