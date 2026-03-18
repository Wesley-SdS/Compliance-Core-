import { describe, it, expect, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PortalService } from './portal.service';

function createMockDb() {
  return {
    query: vi.fn().mockResolvedValue([]),
    queryOne: vi.fn().mockResolvedValue(null),
  };
}

function createMockLogger() {
  return { setContext: vi.fn(), log: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

function createService() {
  const db = createMockDb();
  const logger = createMockLogger();
  const service = new PortalService(db as any, logger as any);
  return { service, db };
}

const validToken = {
  id: 'TOKEN001',
  laudo_id: 'LAUDO001',
  created_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
};

const expiredToken = {
  ...validToken,
  expires_at: new Date(Date.now() - 1000).toISOString(),
};

const laudo = {
  id: 'LAUDO001',
  laboratorio_id: 'LAB001',
  paciente_nome: 'Joao Silva',
  paciente_id: 'PAC001',
  tipo_exame: 'Hemograma',
  data_coleta: '2026-03-15T10:00:00Z',
  liberado_at: '2026-03-16T14:00:00Z',
  assinado_por: 'Dr. Maria Santos',
  bioquimico_responsavel: 'Dr. Maria Santos',
  created_at: '2026-03-15T10:00:00Z',
  updated_at: '2026-03-16T14:00:00Z',
  resultados: JSON.stringify([
    { analito: 'Hemoglobina', resultado: '14.5', unidade: 'g/dL', valorReferencia: '12-17', flag: 'normal' },
    { analito: 'Glicose', resultado: '210', unidade: 'mg/dL', valorReferencia: '70-100', flag: 'alto' },
  ]),
};

const lab = { nome: 'Lab Teste', cnpj: '12345678000199', endereco: 'Rua A, 123' };

describe('PortalService', () => {
  describe('findByToken — valid token', () => {
    it('should return laudo with simplified explanations', async () => {
      const { service, db } = createService();
      db.queryOne
        .mockResolvedValueOnce(validToken)    // portal_tokens
        .mockResolvedValueOnce(laudo)          // laudos
        .mockResolvedValueOnce(lab);           // laboratorios

      const result = await service.findByToken('TOKEN001');

      expect(result.id).toBe('LAUDO001');
      expect(result.paciente).toBe('Joao Silva');
      expect(result.tipoExame).toBe('Hemograma');
      expect(result.laboratorio.nome).toBe('Lab Teste');
      expect(result.resultados).toHaveLength(2);

      // Normal result has proper explanation
      const hb = result.resultados.find((r: any) => r.analito === 'Hemoglobina');
      expect(hb.flag).toBe('normal');
      expect(hb.explicacao).toContain('dentro dos valores normais');

      // High result has proper explanation
      const glicose = result.resultados.find((r: any) => r.analito === 'Glicose');
      expect(glicose.flag).toBe('alto');
      expect(glicose.explicacao).toContain('acima dos valores de referencia');

      // Resumo mentions altered results
      expect(result.resumo).toContain('fora dos valores de referencia');
    });
  });

  describe('findByToken — expired token', () => {
    it('should throw NotFoundException for expired token', async () => {
      const { service, db } = createService();
      db.queryOne.mockResolvedValueOnce(expiredToken);

      await expect(service.findByToken('TOKEN001'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('findByToken — non-existent token', () => {
    it('should throw NotFoundException for unknown token', async () => {
      const { service, db } = createService();
      db.queryOne.mockResolvedValueOnce(null);

      await expect(service.findByToken('FAKE_TOKEN'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('findByToken — all normal results', () => {
    it('should generate positive resumo', async () => {
      const { service, db } = createService();
      const laudoNormal = {
        ...laudo,
        resultados: JSON.stringify([
          { analito: 'Hemoglobina', resultado: '14', unidade: 'g/dL', flag: 'normal' },
          { analito: 'Leucocitos', resultado: '7000', unidade: '/mm3', flag: 'normal' },
        ]),
      };
      db.queryOne
        .mockResolvedValueOnce(validToken)
        .mockResolvedValueOnce(laudoNormal)
        .mockResolvedValueOnce(lab);

      const result = await service.findByToken('TOKEN001');

      expect(result.resumo).toContain('dentro dos valores normais');
    });
  });

  describe('findByToken — critical results', () => {
    it('should generate critical resumo', async () => {
      const { service, db } = createService();
      const laudoCritico = {
        ...laudo,
        resultados: JSON.stringify([
          { analito: 'Leucocitos', resultado: '25000', unidade: '/mm3', flag: 'critico' },
        ]),
      };
      db.queryOne
        .mockResolvedValueOnce(validToken)
        .mockResolvedValueOnce(laudoCritico)
        .mockResolvedValueOnce(lab);

      const result = await service.findByToken('TOKEN001');

      expect(result.resumo).toContain('critico');
      expect(result.resultados[0].explicacao).toContain('atencao medica imediata');
    });
  });
});
