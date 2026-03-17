import { describe, it, expect } from 'vitest';
import { TRIBUTO_CRITERIA } from './tributo.config';

describe('TRIBUTO_CRITERIA', () => {
  it('should have 8 criteria', () => {
    expect(TRIBUTO_CRITERIA).toHaveLength(8);
  });

  describe('sped_em_dia', () => {
    const criterion = TRIBUTO_CRITERIA.find(c => c.id === 'sped_em_dia')!;

    it('CONFORME when SPED is validated for current competencia', () => {
      const entity = {
        competenciaAtual: '2025-03',
        spedFiles: [{ status: 'VALIDADO', competencia: '2025-03' }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME when SPED is missing', () => {
      const entity = { competenciaAtual: '2025-03', spedFiles: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });

    it('NAO_CONFORME when SPED has wrong competencia', () => {
      const entity = {
        competenciaAtual: '2025-03',
        spedFiles: [{ status: 'VALIDADO', competencia: '2025-01' }],
      };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });
  });

  describe('obrigacoes_acessorias', () => {
    const criterion = TRIBUTO_CRITERIA.find(c => c.id === 'obrigacoes_acessorias')!;

    it('CONFORME when all obrigacoes are CUMPRIDA', () => {
      const entity = {
        obrigacoes: [{ status: 'CUMPRIDA' }, { status: 'CUMPRIDA' }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('PARCIAL when some are cumpridas', () => {
      const entity = {
        obrigacoes: [{ status: 'CUMPRIDA' }, { status: 'PENDENTE' }, { status: 'CUMPRIDA' }],
      };
      expect(criterion.evaluate(entity).status).toBe('PARCIAL');
    });

    it('NAO_CONFORME when none are cumpridas', () => {
      const entity = {
        obrigacoes: [{ status: 'PENDENTE' }, { status: 'PENDENTE' }],
      };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });

    it('NAO_APLICAVEL when no obrigacoes', () => {
      const entity = { obrigacoes: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_APLICAVEL');
    });
  });

  describe('certidoes_negativas', () => {
    const criterion = TRIBUTO_CRITERIA.find(c => c.id === 'certidoes_negativas')!;

    it('CONFORME with valid certidao', () => {
      const entity = {
        documents: [{ category: 'certidao_negativa', expiresAt: new Date(Date.now() + 86400000).toISOString() }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME without certidao', () => {
      const entity = { documents: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });
  });

  describe('regime_tributario', () => {
    const criterion = TRIBUTO_CRITERIA.find(c => c.id === 'regime_tributario')!;

    it('CONFORME when regime is set and verified', () => {
      const entity = { regimeTributario: 'SIMPLES', regimeVerificado: true };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME when regime is not verified', () => {
      const entity = { regimeTributario: 'SIMPLES', regimeVerificado: false };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });
  });

  describe('backup_dados', () => {
    const criterion = TRIBUTO_CRITERIA.find(c => c.id === 'backup_dados')!;

    it('CONFORME when backup is atualizado', () => {
      const entity = { backupAtualizado: true };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME when backup is not atualizado', () => {
      const entity = { backupAtualizado: false };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });
  });

  describe('lgpd_dados_clientes', () => {
    const criterion = TRIBUTO_CRITERIA.find(c => c.id === 'lgpd_dados_clientes')!;

    it('CONFORME when LGPD compliance is true', () => {
      const entity = { lgpdCompliance: true };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME when LGPD compliance is false', () => {
      const entity = { lgpdCompliance: false };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });
  });

  describe('procuracao_eletronica', () => {
    const criterion = TRIBUTO_CRITERIA.find(c => c.id === 'procuracao_eletronica')!;

    it('CONFORME with valid procuracao', () => {
      const entity = {
        documents: [{ category: 'procuracao' }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME without procuracao', () => {
      const entity = { documents: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });
  });

  describe('capacitacao_reforma', () => {
    const criterion = TRIBUTO_CRITERIA.find(c => c.id === 'capacitacao_reforma')!;

    it('CONFORME when all profissionais are capacitados', () => {
      const entity = {
        profissionais: [{ reformaTributariaCapacitado: true }, { reformaTributariaCapacitado: true }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('PARCIAL when some are capacitados', () => {
      const entity = {
        profissionais: [
          { reformaTributariaCapacitado: true },
          { reformaTributariaCapacitado: false },
          { reformaTributariaCapacitado: true },
        ],
      };
      expect(criterion.evaluate(entity).status).toBe('PARCIAL');
    });

    it('NAO_CONFORME when none are capacitados', () => {
      const entity = {
        profissionais: [{ reformaTributariaCapacitado: false }],
      };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });

    it('NAO_APLICAVEL when no profissionais', () => {
      const entity = { profissionais: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_APLICAVEL');
    });
  });
});
