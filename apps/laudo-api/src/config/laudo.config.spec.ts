import { describe, it, expect } from 'vitest';
import { LAUDO_CRITERIA } from './laudo.config';

describe('LAUDO_CRITERIA', () => {
  it('should have 8 criteria', () => {
    expect(LAUDO_CRITERIA).toHaveLength(8);
  });

  describe('certificacao_sbpc', () => {
    const criterion = LAUDO_CRITERIA.find(c => c.id === 'certificacao_sbpc')!;

    it('CONFORME with valid SBPC certification', () => {
      const entity = {
        documents: [{ category: 'certificacao_sbpc', expiresAt: new Date(Date.now() + 86400000).toISOString() }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME without SBPC certification', () => {
      const entity = { documents: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });
  });

  describe('controle_qualidade_interno', () => {
    const criterion = LAUDO_CRITERIA.find(c => c.id === 'controle_qualidade_interno')!;

    it('CONFORME when interno quality control is implemented', () => {
      const entity = { controleQualidade: { interno: true } };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME when not implemented', () => {
      const entity = { controleQualidade: { interno: false } };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });

    it('NAO_CONFORME when controleQualidade is missing', () => {
      const entity = {};
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });
  });

  describe('proficiencia_ensaio', () => {
    const criterion = LAUDO_CRITERIA.find(c => c.id === 'proficiencia_ensaio')!;

    it('CONFORME when all ensaios are APROVADO', () => {
      const entity = {
        ensaiosProficiencia: [{ resultado: 'APROVADO' }, { resultado: 'APROVADO' }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('PARCIAL when some ensaios are aprovados', () => {
      const entity = {
        ensaiosProficiencia: [{ resultado: 'APROVADO' }, { resultado: 'REPROVADO' }, { resultado: 'APROVADO' }],
      };
      expect(criterion.evaluate(entity).status).toBe('PARCIAL');
    });

    it('NAO_CONFORME when none are aprovados', () => {
      const entity = {
        ensaiosProficiencia: [{ resultado: 'REPROVADO' }],
      };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });

    it('NAO_APLICAVEL when no ensaios', () => {
      const entity = { ensaiosProficiencia: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_APLICAVEL');
    });
  });

  describe('rastreabilidade_metrologica', () => {
    const criterion = LAUDO_CRITERIA.find(c => c.id === 'rastreabilidade_metrologica')!;

    it('CONFORME when all equipamentos are calibrados with rastreabilidade', () => {
      const entity = {
        equipamentos: [
          { calibracaoValida: true, rastreabilidade: true },
          { calibracaoValida: true, rastreabilidade: true },
        ],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME when equipamentos lack calibracao', () => {
      const entity = {
        equipamentos: [{ calibracaoValida: false, rastreabilidade: false }],
      };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });

    it('NAO_APLICAVEL when no equipamentos', () => {
      const entity = { equipamentos: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_APLICAVEL');
    });
  });

  describe('pop_exames', () => {
    const criterion = LAUDO_CRITERIA.find(c => c.id === 'pop_exames')!;

    it('CONFORME when all exames have updated POP', () => {
      const entity = {
        exames: [{ popAtualizado: true }, { popAtualizado: true }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('PARCIAL when some exames have POP', () => {
      const entity = {
        exames: [{ popAtualizado: true }, { popAtualizado: false }, { popAtualizado: true }],
      };
      expect(criterion.evaluate(entity).status).toBe('PARCIAL');
    });

    it('NAO_APLICAVEL when no exames', () => {
      const entity = { exames: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_APLICAVEL');
    });
  });

  describe('qualificacao_equipe', () => {
    const criterion = LAUDO_CRITERIA.find(c => c.id === 'qualificacao_equipe')!;

    it('CONFORME when all profissionais are qualificados', () => {
      const entity = {
        profissionais: [{ qualificado: true }, { qualificado: true }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME when none are qualificados', () => {
      const entity = {
        profissionais: [{ qualificado: false }],
      };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });

    it('NAO_APLICAVEL when no profissionais', () => {
      const entity = { profissionais: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_APLICAVEL');
    });
  });

  describe('descarte_residuos', () => {
    const criterion = LAUDO_CRITERIA.find(c => c.id === 'descarte_residuos')!;

    it('CONFORME when descarte is conforme', () => {
      const entity = { descarteResiduos: { conformidade: true } };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME when not conforme', () => {
      const entity = { descarteResiduos: { conformidade: false } };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });
  });

  describe('manual_qualidade', () => {
    const criterion = LAUDO_CRITERIA.find(c => c.id === 'manual_qualidade')!;

    it('CONFORME when manual da qualidade exists', () => {
      const entity = { documents: [{ category: 'manual_qualidade' }] };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME when manual is absent', () => {
      const entity = { documents: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });
  });
});
