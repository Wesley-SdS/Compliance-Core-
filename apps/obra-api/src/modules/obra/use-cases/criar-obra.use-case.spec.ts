import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CriarObraUseCase } from './criar-obra.use-case';
import { TipoObra } from '../obra.dto';

const mockDb = {
  query: vi.fn(),
  queryOne: vi.fn(),
};
const mockEventStore = { append: vi.fn() };
const mockLogger = { setContext: vi.fn(), log: vi.fn(), warn: vi.fn(), error: vi.fn() };

describe('CriarObraUseCase', () => {
  let useCase: CriarObraUseCase;

  const validDto = {
    nome: 'Residencial Solar',
    endereco: 'Rua das Flores, 123',
    responsavel: 'Eng. Maria Silva',
    tipoObra: TipoObra.RESIDENCIAL,
    areaM2: 500,
    numeroPavimentos: 3,
    inicioPrevisao: '2026-04-01',
    fimPrevisao: '2027-06-01',
    cnpjConstrutora: '12.345.678/0001-90',
    creaResponsavel: 'CREA-SP 123456',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new CriarObraUseCase(mockDb as any, mockEventStore as any, mockLogger as any);
  });

  it('should insert obra with status PLANEJAMENTO', async () => {
    mockDb.query.mockResolvedValue([]);
    mockDb.queryOne.mockResolvedValue({ id: 'test-id', ...validDto, status: 'PLANEJAMENTO' });
    mockEventStore.append.mockResolvedValue(undefined);

    const result = await useCase.execute(validDto, 'actor-1');

    expect(mockDb.query).toHaveBeenCalledTimes(1);
    const insertCall = mockDb.query.mock.calls[0];
    expect(insertCall[0]).toContain('INSERT INTO obras');
    expect(insertCall[0]).toContain('PLANEJAMENTO');
    expect(insertCall[1]).toContain(validDto.nome);
    expect(insertCall[1]).toContain(validDto.endereco);
  });

  it('should append OBRA_CREATED event to event store', async () => {
    mockDb.query.mockResolvedValue([]);
    mockDb.queryOne.mockResolvedValue({ id: 'test-id', ...validDto });
    mockEventStore.append.mockResolvedValue(undefined);

    await useCase.execute(validDto, 'actor-1');

    expect(mockEventStore.append).toHaveBeenCalledTimes(1);
    const [aggregateId, aggregateType, eventType, payload, metadata] = mockEventStore.append.mock.calls[0];
    expect(aggregateType).toBe('obra');
    expect(eventType).toBe('OBRA_CREATED');
    expect(payload.nome).toBe(validDto.nome);
    expect(metadata.actorId).toBe('actor-1');
  });

  it('should return the created obra', async () => {
    const createdObra = { id: 'abc123', ...validDto, status: 'PLANEJAMENTO' };
    mockDb.query.mockResolvedValue([]);
    mockDb.queryOne.mockResolvedValue(createdObra);
    mockEventStore.append.mockResolvedValue(undefined);

    const result = await useCase.execute(validDto, 'actor-1');
    expect(result).toEqual(createdObra);
  });

  it('should handle optional fields as null', async () => {
    const dtoWithoutOptionals = {
      nome: 'Obra Simples',
      endereco: 'Av. Brasil, 456',
      responsavel: 'Eng. Joao',
      tipoObra: TipoObra.COMERCIAL,
      areaM2: 200,
      numeroPavimentos: 1,
      inicioPrevisao: '2026-05-01',
      fimPrevisao: '2026-12-01',
    };
    mockDb.query.mockResolvedValue([]);
    mockDb.queryOne.mockResolvedValue({ id: 'test-id', ...dtoWithoutOptionals });
    mockEventStore.append.mockResolvedValue(undefined);

    await useCase.execute(dtoWithoutOptionals, 'actor-2');

    const insertArgs = mockDb.query.mock.calls[0][1];
    // cnpjConstrutora and creaResponsavel should be null
    expect(insertArgs[insertArgs.length - 3]).toBeNull(); // cnpjConstrutora
    expect(insertArgs[insertArgs.length - 2]).toBeNull(); // creaResponsavel
  });

  it('should log the creation', async () => {
    mockDb.query.mockResolvedValue([]);
    mockDb.queryOne.mockResolvedValue({ id: 'test-id' });
    mockEventStore.append.mockResolvedValue(undefined);

    await useCase.execute(validDto, 'actor-1');

    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringContaining('Obra created'),
      expect.any(Object),
    );
  });
});
