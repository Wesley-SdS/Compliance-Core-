import { describe, it, expect } from 'vitest';
import { OBRA_CRITERIA } from './obra.config';

describe('OBRA_CRITERIA', () => {
  it('should have 8 criteria', () => {
    expect(OBRA_CRITERIA).toHaveLength(8);
  });

  describe('nr18_condicoes_trabalho', () => {
    const criterion = OBRA_CRITERIA.find(c => c.id === 'nr18_condicoes_trabalho')!;

    it('CONFORME with valid NR-18 doc', () => {
      const entity = {
        documents: [{ category: 'nr18', expiresAt: new Date(Date.now() + 86400000).toISOString() }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME without NR-18 doc', () => {
      const entity = { documents: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });
  });

  describe('alvara_construcao', () => {
    const criterion = OBRA_CRITERIA.find(c => c.id === 'alvara_construcao')!;

    it('CONFORME with valid alvara', () => {
      const entity = {
        documents: [{ category: 'alvara_construcao', expiresAt: new Date(Date.now() + 86400000).toISOString() }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME when expired', () => {
      const entity = {
        documents: [{ category: 'alvara_construcao', expiresAt: '2020-01-01' }],
      };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });
  });

  describe('art_rrt', () => {
    const criterion = OBRA_CRITERIA.find(c => c.id === 'art_rrt')!;

    it('CONFORME with valid ART/RRT', () => {
      const entity = {
        documents: [{ category: 'art_rrt' }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME without ART/RRT', () => {
      const entity = { documents: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });
  });

  describe('licenca_ambiental', () => {
    const criterion = OBRA_CRITERIA.find(c => c.id === 'licenca_ambiental')!;

    it('CONFORME with valid licenca ambiental', () => {
      const entity = {
        documents: [{ category: 'licenca_ambiental' }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME without licenca ambiental', () => {
      const entity = { documents: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });
  });

  describe('epi_trabalhadores', () => {
    const criterion = OBRA_CRITERIA.find(c => c.id === 'epi_trabalhadores')!;

    it('CONFORME when all trabalhadores have valid EPI', () => {
      const entity = {
        trabalhadores: [{ epiValido: true }, { epiValido: true }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
      expect(criterion.evaluate(entity).score).toBe(100);
    });

    it('NAO_CONFORME when no trabalhadores have valid EPI', () => {
      const entity = {
        trabalhadores: [{ epiValido: false }, { epiValido: false }],
      };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });

    it('PARCIAL when some trabalhadores have EPI', () => {
      const entity = {
        trabalhadores: [{ epiValido: true }, { epiValido: false }, { epiValido: true }],
      };
      expect(criterion.evaluate(entity).status).toBe('PARCIAL');
    });

    it('NAO_APLICAVEL when no trabalhadores', () => {
      const entity = { trabalhadores: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_APLICAVEL');
    });
  });

  describe('diario_obra', () => {
    const criterion = OBRA_CRITERIA.find(c => c.id === 'diario_obra')!;

    it('CONFORME when diario de obra is atualizado', () => {
      const entity = { diarioObra: { atualizado: true } };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME when diario de obra is not atualizado', () => {
      const entity = { diarioObra: { atualizado: false } };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });
  });

  describe('seguro_responsabilidade', () => {
    const criterion = OBRA_CRITERIA.find(c => c.id === 'seguro_responsabilidade')!;

    it('CONFORME with valid seguro', () => {
      const entity = {
        documents: [{ category: 'seguro', expiresAt: new Date(Date.now() + 86400000).toISOString() }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME without seguro', () => {
      const entity = { documents: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });
  });

  describe('pcmso_ppra', () => {
    const criterion = OBRA_CRITERIA.find(c => c.id === 'pcmso_ppra')!;

    it('CONFORME with both PCMSO and PPRA', () => {
      const entity = {
        documents: [{ category: 'pcmso' }, { category: 'ppra' }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('PARCIAL with only one program', () => {
      const entity = { documents: [{ category: 'pcmso' }] };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('PARCIAL');
      expect(result.score).toBe(50);
    });

    it('NAO_CONFORME with neither', () => {
      const entity = { documents: [] };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });
  });
});
