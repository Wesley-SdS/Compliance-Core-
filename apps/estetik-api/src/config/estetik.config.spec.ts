import { describe, it, expect } from 'vitest';
import { ESTETIK_CRITERIA } from './estetik.config';

describe('ESTETIK_CRITERIA', () => {
  it('should have 9 criteria', () => {
    expect(ESTETIK_CRITERIA).toHaveLength(9);
  });

  it('should have weights that sum to 100', () => {
    const totalWeight = ESTETIK_CRITERIA.reduce((sum, c) => sum + c.weight, 0);
    expect(totalWeight).toBe(100);
  });

  describe('alvara_funcionamento', () => {
    const criterion = ESTETIK_CRITERIA.find(c => c.id === 'alvara_funcionamento')!;

    it('CONFORME when entity has valid alvara document', () => {
      const entity = {
        documents: [{ category: 'alvara', expiresAt: new Date(Date.now() + 86400000).toISOString() }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('NAO_CONFORME when entity has no alvara document', () => {
      const entity = { documents: [] };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });

    it('NAO_CONFORME when alvara is expired', () => {
      const entity = {
        documents: [{ category: 'alvara', expiresAt: new Date('2020-01-01').toISOString() }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });
  });

  describe('licenca_sanitaria', () => {
    const criterion = ESTETIK_CRITERIA.find(c => c.id === 'licenca_sanitaria')!;

    it('CONFORME with valid licenca sanitaria', () => {
      const entity = {
        documents: [{ category: 'licenca_sanitaria', expiresAt: new Date(Date.now() + 86400000).toISOString() }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('NAO_CONFORME without licenca sanitaria', () => {
      const entity = { documents: [] };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });
  });

  describe('registro_anvisa_equipamentos', () => {
    const criterion = ESTETIK_CRITERIA.find(c => c.id === 'registro_anvisa_equipamentos')!;

    it('CONFORME when all equipamentos have Anvisa registration', () => {
      const entity = {
        equipamentos: [{ registroAnvisa: true }, { registroAnvisa: true }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('NAO_CONFORME when no equipamentos have Anvisa registration', () => {
      const entity = {
        equipamentos: [{ registroAnvisa: false }, { registroAnvisa: false }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });

    it('PARCIAL when some equipamentos have Anvisa registration', () => {
      const entity = {
        equipamentos: [{ registroAnvisa: true }, { registroAnvisa: false }, { registroAnvisa: true }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('PARCIAL');
      expect(result.score).toBeCloseTo(66.67, 0);
    });

    it('NAO_APLICAVEL when no equipamentos', () => {
      const entity = { equipamentos: [] };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_APLICAVEL');
      expect(result.score).toBe(100);
    });
  });

  describe('pops_atualizados', () => {
    const criterion = ESTETIK_CRITERIA.find(c => c.id === 'pops_atualizados')!;

    it('CONFORME when all procedimentos have updated POP', () => {
      const entity = {
        procedimentos: [
          { popId: 'p1', popUpdatedAt: new Date().toISOString() },
          { popId: 'p2', popUpdatedAt: new Date().toISOString() },
        ],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('NAO_CONFORME when no procedimentos have POP', () => {
      const entity = {
        procedimentos: [{ popId: null }, { popId: null }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });

    it('NAO_APLICAVEL when no procedimentos', () => {
      const entity = { procedimentos: [] };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_APLICAVEL');
    });
  });

  describe('lgpd_consentimento', () => {
    const criterion = ESTETIK_CRITERIA.find(c => c.id === 'lgpd_consentimento')!;

    it('CONFORME when LGPD terms are configured and accepted', () => {
      const entity = { lgpdTermVersion: '1.0', lgpdTermAccepted: true };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('NAO_CONFORME when LGPD not configured', () => {
      const entity = {};
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });
  });

  describe('responsavel_tecnico', () => {
    const criterion = ESTETIK_CRITERIA.find(c => c.id === 'responsavel_tecnico')!;

    it('CONFORME when RT has CRM', () => {
      const entity = { responsavelTecnico: { nome: 'Dr. Silva', crm: '12345-SP' } };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('NAO_CONFORME when no RT registered', () => {
      const entity = {};
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });
  });

  describe('treinamento_equipe', () => {
    const criterion = ESTETIK_CRITERIA.find(c => c.id === 'treinamento_equipe')!;

    it('CONFORME when all profissionais have valid training', () => {
      const entity = {
        profissionais: [{ treinamentoValido: true }, { treinamentoValido: true }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('PARCIAL when some profissionais have training', () => {
      const entity = {
        profissionais: [{ treinamentoValido: true }, { treinamentoValido: false }, { treinamentoValido: true }],
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('PARCIAL');
    });

    it('NAO_APLICAVEL when no profissionais', () => {
      const entity = { profissionais: [] };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_APLICAVEL');
    });
  });

  describe('pgrss', () => {
    const criterion = ESTETIK_CRITERIA.find(c => c.id === 'pgrss')!;

    it('CONFORME when PGRSS is implemented and updated', () => {
      const entity = { pgrss: { implementado: true, atualizado: true } };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('PARCIAL when PGRSS is implemented but not updated', () => {
      const entity = { pgrss: { implementado: true, atualizado: false } };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('PARCIAL');
      expect(result.score).toBe(50);
    });

    it('NAO_CONFORME when PGRSS is not implemented', () => {
      const entity = { pgrss: { implementado: false } };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });
  });

  describe('infraestrutura', () => {
    const criterion = ESTETIK_CRITERIA.find(c => c.id === 'infraestrutura')!;

    it('CONFORME when all infrastructure checks pass', () => {
      const entity = {
        infraestrutura: {
          extintorValido: true,
          saidaEmergencia: true,
          acessibilidade: true,
          sinalizacao: true,
        },
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('CONFORME');
      expect(result.score).toBe(100);
    });

    it('PARCIAL when some infrastructure checks pass', () => {
      const entity = {
        infraestrutura: {
          extintorValido: true,
          saidaEmergencia: true,
          acessibilidade: false,
          sinalizacao: false,
        },
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('PARCIAL');
      expect(result.score).toBe(50);
    });

    it('NAO_CONFORME when no infrastructure checks pass', () => {
      const entity = {
        infraestrutura: {
          extintorValido: false,
          saidaEmergencia: false,
          acessibilidade: false,
          sinalizacao: false,
        },
      };
      const result = criterion.evaluate(entity);
      expect(result.status).toBe('NAO_CONFORME');
      expect(result.score).toBe(0);
    });
  });
});
