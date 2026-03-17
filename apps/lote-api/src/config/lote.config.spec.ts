import { describe, it, expect } from 'vitest';
import { LOTE_CRITERIA } from './lote.config';

describe('LOTE_CRITERIA', () => {
  it('should have 8 criteria', () => {
    expect(LOTE_CRITERIA).toHaveLength(8);
  });

  describe('registro_loteamento', () => {
    const criterion = LOTE_CRITERIA.find(c => c.id === 'registro_loteamento')!;

    it('CONFORME when registered with matricula', () => {
      const entity = { registroCartorio: true, matriculaNumero: '12345' };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
      expect(criterion.evaluate(entity).details).toContain('12345');
    });

    it('NAO_CONFORME when not registered', () => {
      const entity = { registroCartorio: false };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });
  });

  describe('lei_6766_conformidade', () => {
    const criterion = LOTE_CRITERIA.find(c => c.id === 'lei_6766_conformidade')!;

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

    it('NAO_CONFORME when 0 or 1 requisito is met', () => {
      const entity = {
        areasPublicasEntregues: false,
        infraestruturaMinima: false,
        aprovacaoPrefeitura: true,
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
    });
  });

  describe('dimob_em_dia', () => {
    const criterion = LOTE_CRITERIA.find(c => c.id === 'dimob_em_dia')!;

    it('CONFORME when DIMOB is entregue', () => {
      const entity = { dimobEntregue: true };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME when DIMOB is pendente', () => {
      const entity = { dimobEntregue: false };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });
  });

  describe('efd_reinf', () => {
    const criterion = LOTE_CRITERIA.find(c => c.id === 'efd_reinf')!;

    it('CONFORME when EFD-Reinf is entregue', () => {
      const entity = { efdReinfEntregue: true };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME when pendente', () => {
      const entity = { efdReinfEntregue: false };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });
  });

  describe('lgpd_compradores', () => {
    const criterion = LOTE_CRITERIA.find(c => c.id === 'lgpd_compradores')!;

    it('CONFORME when all compradores have consentimento', () => {
      const entity = {
        compradores: [{ lgpdConsentimento: true }, { lgpdConsentimento: true }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('PARCIAL when some have consentimento', () => {
      const entity = {
        compradores: [{ lgpdConsentimento: true }, { lgpdConsentimento: false }, { lgpdConsentimento: true }],
      };
      expect(criterion.evaluate(entity).status).toBe('PARCIAL');
    });

    it('NAO_CONFORME when none have consentimento', () => {
      const entity = {
        compradores: [{ lgpdConsentimento: false }],
      };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });

    it('NAO_APLICAVEL when no compradores', () => {
      const entity = { compradores: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_APLICAVEL');
    });
  });

  describe('contratos_registrados', () => {
    const criterion = LOTE_CRITERIA.find(c => c.id === 'contratos_registrados')!;

    it('CONFORME when all contratos are registrados', () => {
      const entity = {
        contratos: [{ registrado: true }, { registrado: true }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME when no contratos are registrados', () => {
      const entity = {
        contratos: [{ registrado: false }],
      };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });

    it('NAO_APLICAVEL when no contratos', () => {
      const entity = { contratos: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_APLICAVEL');
    });
  });

  describe('infraestrutura_entregue', () => {
    const criterion = LOTE_CRITERIA.find(c => c.id === 'infraestrutura_entregue')!;

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

    it('PARCIAL when 3 of 5 items are delivered', () => {
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
    });
  });

  describe('licenca_ambiental', () => {
    const criterion = LOTE_CRITERIA.find(c => c.id === 'licenca_ambiental')!;

    it('CONFORME with valid licenca ambiental', () => {
      const entity = {
        documents: [{ category: 'licenca_ambiental', expiresAt: new Date(Date.now() + 86400000).toISOString() }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME without licenca ambiental', () => {
      const entity = { documents: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });
  });
});
