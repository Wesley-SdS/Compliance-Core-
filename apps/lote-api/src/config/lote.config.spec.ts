import { describe, it, expect } from 'vitest';
import { LOTE_CRITERIA } from './lote.config';

describe('LOTE_CRITERIA', () => {
  it('should have 8 criteria', () => {
    expect(LOTE_CRITERIA).toHaveLength(8);
  });

  it('weights should sum to 100', () => {
    const totalWeight = LOTE_CRITERIA.reduce((sum, c) => sum + c.weight, 0);
    expect(totalWeight).toBe(100);
  });

  it('each criterion should have unique id', () => {
    const ids = LOTE_CRITERIA.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each criterion should return valid criterionId matching its id', () => {
    for (const criterion of LOTE_CRITERIA) {
      const result = criterion.evaluate({});
      expect(result.criterionId).toBe(criterion.id);
    }
  });

  describe('registro_loteamento (weight 20)', () => {
    const criterion = LOTE_CRITERIA.find(c => c.id === 'registro_loteamento')!;

    it('has correct weight', () => {
      expect(criterion.weight).toBe(20);
    });

    it('CONFORME when registered with matricula', () => {
      const entity = { registroCartorio: true, matriculaNumero: '12345' };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
      expect(criterion.evaluate(entity).score).toBe(100);
      expect(criterion.evaluate(entity).details).toContain('12345');
    });

    it('NAO_CONFORME when not registered', () => {
      const entity = { registroCartorio: false };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });

    it('NAO_CONFORME when registroCartorio true but matriculaNumero missing', () => {
      const entity = { registroCartorio: true };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });

    it('NAO_CONFORME when matriculaNumero present but registroCartorio false', () => {
      const entity = { registroCartorio: false, matriculaNumero: '99999' };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });
  });

  describe('lei_6766_conformidade (weight 15)', () => {
    const criterion = LOTE_CRITERIA.find(c => c.id === 'lei_6766_conformidade')!;

    it('has correct weight', () => {
      expect(criterion.weight).toBe(15);
    });

    it('CONFORME when all 3 requisitos are met', () => {
      const entity = {
        areasPublicasEntregues: true,
        infraestruturaMinima: true,
        aprovacaoPrefeitura: true,
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
      expect(criterion.evaluate(entity).score).toBe(100);
    });

    it('PARCIAL when 2 of 3 requisitos are met', () => {
      const entity = {
        areasPublicasEntregues: true,
        infraestruturaMinima: true,
        aprovacaoPrefeitura: false,
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('PARCIAL');
      expect(result.score).toBeCloseTo(66.67, 0);
    });

    it('NAO_CONFORME when 1 of 3 requisitos is met', () => {
      const entity = {
        areasPublicasEntregues: false,
        infraestruturaMinima: false,
        aprovacaoPrefeitura: true,
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBeCloseTo(33.33, 0);
    });

    it('NAO_CONFORME when 0 requisitos are met', () => {
      const entity = {
        areasPublicasEntregues: false,
        infraestruturaMinima: false,
        aprovacaoPrefeitura: false,
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });

    it('details show count of requisitos atendidos', () => {
      const entity = {
        areasPublicasEntregues: true,
        infraestruturaMinima: false,
        aprovacaoPrefeitura: true,
      };
      const result = criterion.evaluate(entity);
      expect(result.details).toContain('2/3');
    });
  });

  describe('dimob_em_dia (weight 15)', () => {
    const criterion = LOTE_CRITERIA.find(c => c.id === 'dimob_em_dia')!;

    it('has correct weight', () => {
      expect(criterion.weight).toBe(15);
    });

    it('CONFORME when DIMOB is entregue', () => {
      const entity = { dimobEntregue: true };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('NAO_CONFORME when DIMOB is pendente', () => {
      const entity = { dimobEntregue: false };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });
  });

  describe('efd_reinf (weight 10)', () => {
    const criterion = LOTE_CRITERIA.find(c => c.id === 'efd_reinf')!;

    it('has correct weight', () => {
      expect(criterion.weight).toBe(10);
    });

    it('CONFORME when EFD-Reinf is entregue', () => {
      const entity = { efdReinfEntregue: true };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('NAO_CONFORME when pendente', () => {
      const entity = { efdReinfEntregue: false };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });
  });

  describe('lgpd_compradores (weight 10)', () => {
    const criterion = LOTE_CRITERIA.find(c => c.id === 'lgpd_compradores')!;

    it('has correct weight', () => {
      expect(criterion.weight).toBe(10);
    });

    it('CONFORME when all compradores have consentimento', () => {
      const entity = {
        compradores: [{ lgpdConsentimento: true }, { lgpdConsentimento: true }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('PARCIAL when some have consentimento (above 50%)', () => {
      const entity = {
        compradores: [{ lgpdConsentimento: true }, { lgpdConsentimento: false }, { lgpdConsentimento: true }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('PARCIAL');
      expect(result.score).toBeCloseTo(66.67, 0);
    });

    it('NAO_CONFORME when none have consentimento', () => {
      const entity = {
        compradores: [{ lgpdConsentimento: false }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });

    it('NAO_CONFORME when 50% or less have consentimento', () => {
      const entity = {
        compradores: [{ lgpdConsentimento: true }, { lgpdConsentimento: false }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(50);
    });

    it('NAO_APLICAVEL when no compradores', () => {
      const entity = { compradores: [] };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_APLICAVEL');
      expect(result.score).toBe(100);
    });

    it('NAO_APLICAVEL when compradores is undefined', () => {
      const entity = {};
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_APLICAVEL');
    });

    it('details show count of compradores with consentimento', () => {
      const entity = {
        compradores: [{ lgpdConsentimento: true }, { lgpdConsentimento: false }, { lgpdConsentimento: true }],
      };
      const result = criterion.evaluate(entity);
      expect(result.details).toContain('2/3');
    });
  });

  describe('contratos_registrados (weight 10)', () => {
    const criterion = LOTE_CRITERIA.find(c => c.id === 'contratos_registrados')!;

    it('has correct weight', () => {
      expect(criterion.weight).toBe(10);
    });

    it('CONFORME when all contratos are registrados', () => {
      const entity = {
        contratos: [{ registrado: true }, { registrado: true }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('PARCIAL when some contratos are registrados (above 50%)', () => {
      const entity = {
        contratos: [{ registrado: true }, { registrado: true }, { registrado: false }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('PARCIAL');
      expect(result.score).toBeCloseTo(66.67, 0);
    });

    it('NAO_CONFORME when no contratos are registrados', () => {
      const entity = {
        contratos: [{ registrado: false }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });

    it('NAO_APLICAVEL when no contratos', () => {
      const entity = { contratos: [] };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_APLICAVEL');
      expect(result.score).toBe(100);
    });

    it('details show count of contratos registrados', () => {
      const entity = {
        contratos: [{ registrado: true }, { registrado: false }],
      };
      const result = criterion.evaluate(entity);
      expect(result.details).toContain('1/2');
    });
  });

  describe('infraestrutura_entregue (weight 10)', () => {
    const criterion = LOTE_CRITERIA.find(c => c.id === 'infraestrutura_entregue')!;

    it('has correct weight', () => {
      expect(criterion.weight).toBe(10);
    });

    it('CONFORME when all 5 infrastructure items are delivered', () => {
      const entity = {
        infraestrutura: {
          agua: true,
          esgoto: true,
          energia: true,
          pavimentacao: true,
          drenagem: true,
        },
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
      expect(criterion.evaluate(entity).score).toBe(100);
    });

    it('PARCIAL when 3 of 5 items are delivered (60%)', () => {
      const entity = {
        infraestrutura: {
          agua: true,
          esgoto: true,
          energia: true,
          pavimentacao: false,
          drenagem: false,
        },
      };
      expect(criterion.evaluate(entity).status).toBe('PARCIAL');
      expect(criterion.evaluate(entity).score).toBe(60);
    });

    it('PARCIAL when 4 of 5 items are delivered (80%)', () => {
      const entity = {
        infraestrutura: {
          agua: true,
          esgoto: true,
          energia: true,
          pavimentacao: true,
          drenagem: false,
        },
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('PARCIAL');
      expect(result.score).toBe(80);
    });

    it('NAO_CONFORME when 2 or fewer items are delivered', () => {
      const entity = {
        infraestrutura: {
          agua: true,
          esgoto: false,
          energia: false,
          pavimentacao: false,
          drenagem: false,
        },
      };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
      expect(criterion.evaluate(entity).score).toBe(20);
    });

    it('NAO_CONFORME when none are delivered', () => {
      const entity = {
        infraestrutura: {
          agua: false,
          esgoto: false,
          energia: false,
          pavimentacao: false,
          drenagem: false,
        },
      };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
      expect(criterion.evaluate(entity).score).toBe(0);
    });

    it('details show count of itens entregues', () => {
      const entity = {
        infraestrutura: {
          agua: true,
          esgoto: true,
          energia: false,
          pavimentacao: false,
          drenagem: false,
        },
      };
      const result = criterion.evaluate(entity);
      expect(result.details).toContain('2/5');
    });
  });

  describe('licenca_ambiental (weight 10)', () => {
    const criterion = LOTE_CRITERIA.find(c => c.id === 'licenca_ambiental')!;

    it('has correct weight', () => {
      expect(criterion.weight).toBe(10);
    });

    it('CONFORME with valid licenca ambiental (future expiry)', () => {
      const entity = {
        documents: [{ category: 'licenca_ambiental', expiresAt: new Date(Date.now() + 86400000).toISOString() }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('CONFORME with licenca ambiental without expiry date', () => {
      const entity = {
        documents: [{ category: 'licenca_ambiental' }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('NAO_CONFORME with expired licenca ambiental', () => {
      const entity = {
        documents: [{ category: 'licenca_ambiental', expiresAt: new Date(Date.now() - 86400000).toISOString() }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });

    it('NAO_CONFORME without licenca ambiental', () => {
      const entity = { documents: [] };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });

    it('NAO_CONFORME when documents has other categories but no licenca', () => {
      const entity = {
        documents: [{ category: 'contrato_compra_venda' }, { category: 'escritura' }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
    });

    it('CONFORME when mixed documents include valid licenca', () => {
      const entity = {
        documents: [
          { category: 'contrato_compra_venda' },
          { category: 'licenca_ambiental', expiresAt: new Date(Date.now() + 86400000).toISOString() },
          { category: 'escritura' },
        ],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
    });
  });
});
