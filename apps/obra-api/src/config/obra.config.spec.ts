import { describe, it, expect } from 'vitest';
import { OBRA_CRITERIA, OBRA_DOC_CATEGORIES, OBRA_ALERT_TYPES } from './obra.config';

describe('OBRA_CRITERIA', () => {
  it('should have 8 criteria', () => {
    expect(OBRA_CRITERIA).toHaveLength(8);
  });

  it('weights should sum to 100', () => {
    const totalWeight = OBRA_CRITERIA.reduce((sum, c) => sum + c.weight, 0);
    expect(totalWeight).toBe(100);
  });

  it('all criteria should have unique IDs', () => {
    const ids = OBRA_CRITERIA.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  describe('nr18_condicoes_trabalho (weight: 20)', () => {
    const criterion = OBRA_CRITERIA.find(c => c.id === 'nr18_condicoes_trabalho')!;

    it('should have weight 20', () => {
      expect(criterion.weight).toBe(20);
    });

    it('CONFORME with valid NR-18 doc', () => {
      const entity = {
        documents: [{ category: 'nr18', expiresAt: new Date(Date.now() + 86400000).toISOString() }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('NAO_CONFORME without NR-18 doc', () => {
      const entity = { documents: [] };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });

    it('NAO_CONFORME when NR-18 doc is expired', () => {
      const entity = {
        documents: [{ category: 'nr18', expiresAt: '2020-01-01' }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });

    it('CONFORME when NR-18 doc has no expiry date', () => {
      const entity = {
        documents: [{ category: 'nr18' }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('NAO_CONFORME when documents exist but none are nr18', () => {
      const entity = {
        documents: [{ category: 'alvara_construcao' }, { category: 'seguro' }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
    });
  });

  describe('alvara_construcao (weight: 15)', () => {
    const criterion = OBRA_CRITERIA.find(c => c.id === 'alvara_construcao')!;

    it('should have weight 15', () => {
      expect(criterion.weight).toBe(15);
    });

    it('CONFORME with valid alvara (vigente)', () => {
      const entity = {
        documents: [{ category: 'alvara_construcao', expiresAt: new Date(Date.now() + 86400000).toISOString() }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('NAO_CONFORME when alvara is vencido (expired)', () => {
      const entity = {
        documents: [{ category: 'alvara_construcao', expiresAt: '2020-01-01' }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });

    it('NAO_CONFORME when no alvara exists', () => {
      const entity = { documents: [] };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
    });

    it('CONFORME when alvara is vencendo (expiring soon but still valid)', () => {
      const entity = {
        documents: [{ category: 'alvara_construcao', expiresAt: new Date(Date.now() + 3600000).toISOString() }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
    });

    it('CONFORME when alvara has no expiry', () => {
      const entity = {
        documents: [{ category: 'alvara_construcao' }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });
  });

  describe('art_rrt (weight: 15)', () => {
    const criterion = OBRA_CRITERIA.find(c => c.id === 'art_rrt')!;

    it('should have weight 15', () => {
      expect(criterion.weight).toBe(15);
    });

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

    it('NAO_CONFORME when ART is expired', () => {
      const entity = {
        documents: [{ category: 'art_rrt', expiresAt: '2020-06-01' }],
      };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });

    it('CONFORME among other documents', () => {
      const entity = {
        documents: [
          { category: 'seguro' },
          { category: 'art_rrt', expiresAt: new Date(Date.now() + 86400000).toISOString() },
          { category: 'nr18' },
        ],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });
  });

  describe('licenca_ambiental (weight: 15)', () => {
    const criterion = OBRA_CRITERIA.find(c => c.id === 'licenca_ambiental')!;

    it('should have weight 15', () => {
      expect(criterion.weight).toBe(15);
    });

    it('CONFORME with valid licenca ambiental', () => {
      const entity = {
        documents: [{ category: 'licenca_ambiental' }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('NAO_CONFORME without licenca ambiental', () => {
      const entity = { documents: [] };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });

    it('NAO_CONFORME when licenca is expired', () => {
      const entity = {
        documents: [{ category: 'licenca_ambiental', expiresAt: '2023-01-01' }],
      };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });

    it('CONFORME when licenca has no expiry (perpetual)', () => {
      const entity = {
        documents: [{ category: 'licenca_ambiental' }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });
  });

  describe('epi_trabalhadores (weight: 10)', () => {
    const criterion = OBRA_CRITERIA.find(c => c.id === 'epi_trabalhadores')!;

    it('should have weight 10', () => {
      expect(criterion.weight).toBe(10);
    });

    it('CONFORME when all trabalhadores have valid EPI', () => {
      const entity = {
        trabalhadores: [{ epiValido: true }, { epiValido: true }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('NAO_CONFORME when no trabalhadores have valid EPI', () => {
      const entity = {
        trabalhadores: [{ epiValido: false }, { epiValido: false }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });

    it('PARCIAL when some trabalhadores have EPI (>50%)', () => {
      const entity = {
        trabalhadores: [{ epiValido: true }, { epiValido: false }, { epiValido: true }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('PARCIAL');
      expect(result.score).toBeCloseTo(66.67, 0);
    });

    it('NAO_CONFORME when minority have EPI (<=50%)', () => {
      const entity = {
        trabalhadores: [{ epiValido: true }, { epiValido: false }, { epiValido: false }, { epiValido: false }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(25);
    });

    it('NAO_APLICAVEL when no trabalhadores', () => {
      const entity = { trabalhadores: [] };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_APLICAVEL');
      expect(result.score).toBe(100);
    });

    it('NAO_APLICAVEL when trabalhadores is undefined', () => {
      const entity = {};
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_APLICAVEL');
      expect(result.score).toBe(100);
    });

    it('CONFORME with single worker with valid EPI', () => {
      const entity = {
        trabalhadores: [{ epiValido: true }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('exactly 50% EPI should be NAO_CONFORME', () => {
      const entity = {
        trabalhadores: [{ epiValido: true }, { epiValido: false }],
      };
      // 50% is NOT > 50%, so NAO_CONFORME
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });
  });

  describe('diario_obra (weight: 10)', () => {
    const criterion = OBRA_CRITERIA.find(c => c.id === 'diario_obra')!;

    it('should have weight 10', () => {
      expect(criterion.weight).toBe(10);
    });

    it('CONFORME when diario is atualizado', () => {
      const entity = { diarioObra: { atualizado: true } };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('NAO_CONFORME when diario is not atualizado', () => {
      const entity = { diarioObra: { atualizado: false } };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });

    it('NAO_CONFORME when diarioObra is absent', () => {
      const entity = {};
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });

    it('NAO_CONFORME when diarioObra is null', () => {
      const entity = { diarioObra: null };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
    });
  });

  describe('seguro_responsabilidade (weight: 10)', () => {
    const criterion = OBRA_CRITERIA.find(c => c.id === 'seguro_responsabilidade')!;

    it('should have weight 10', () => {
      expect(criterion.weight).toBe(10);
    });

    it('CONFORME with valid seguro (vigente)', () => {
      const entity = {
        documents: [{ category: 'seguro', expiresAt: new Date(Date.now() + 86400000).toISOString() }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('NAO_CONFORME when seguro is vencido (expired)', () => {
      const entity = {
        documents: [{ category: 'seguro', expiresAt: '2022-01-01' }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });

    it('NAO_CONFORME without seguro', () => {
      const entity = { documents: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });

    it('CONFORME with seguro that has no expiry', () => {
      const entity = {
        documents: [{ category: 'seguro' }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME when only other docs exist', () => {
      const entity = {
        documents: [{ category: 'nr18' }, { category: 'alvara_construcao' }],
      };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });
  });

  describe('pcmso_ppra (weight: 5)', () => {
    const criterion = OBRA_CRITERIA.find(c => c.id === 'pcmso_ppra')!;

    it('should have weight 5', () => {
      expect(criterion.weight).toBe(5);
    });

    it('CONFORME with both PCMSO and PPRA', () => {
      const entity = {
        documents: [{ category: 'pcmso' }, { category: 'ppra' }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('PARCIAL with only PCMSO', () => {
      const entity = { documents: [{ category: 'pcmso' }] };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('PARCIAL');
      expect(result.score).toBe(50);
    });

    it('PARCIAL with only PPRA', () => {
      const entity = { documents: [{ category: 'ppra' }] };
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

    it('CONFORME with both among other documents', () => {
      const entity = {
        documents: [{ category: 'pcmso' }, { category: 'nr18' }, { category: 'ppra' }, { category: 'seguro' }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });
  });
});

describe('OBRA_DOC_CATEGORIES', () => {
  it('should have 18 categories', () => {
    expect(OBRA_DOC_CATEGORIES).toHaveLength(18);
  });

  it('should contain critical categories', () => {
    expect(OBRA_DOC_CATEGORIES).toContain('alvara_construcao');
    expect(OBRA_DOC_CATEGORIES).toContain('art_rrt');
    expect(OBRA_DOC_CATEGORIES).toContain('licenca_ambiental');
    expect(OBRA_DOC_CATEGORIES).toContain('nota_fiscal_material');
    expect(OBRA_DOC_CATEGORIES).toContain('nr18');
    expect(OBRA_DOC_CATEGORIES).toContain('pcmso');
    expect(OBRA_DOC_CATEGORIES).toContain('ppra');
  });

  it('should not have duplicates', () => {
    expect(new Set(OBRA_DOC_CATEGORIES).size).toBe(OBRA_DOC_CATEGORIES.length);
  });
});

describe('OBRA_ALERT_TYPES', () => {
  it('should have 10 alert types', () => {
    expect(OBRA_ALERT_TYPES).toHaveLength(10);
  });

  it('should contain critical alert types', () => {
    expect(OBRA_ALERT_TYPES).toContain('DOC_EXPIRY');
    expect(OBRA_ALERT_TYPES).toContain('ALVARA_EXPIRY');
    expect(OBRA_ALERT_TYPES).toContain('INSURANCE_EXPIRY');
    expect(OBRA_ALERT_TYPES).toContain('NR_COMPLIANCE');
    expect(OBRA_ALERT_TYPES).toContain('ETAPA_DEADLINE');
  });
});
