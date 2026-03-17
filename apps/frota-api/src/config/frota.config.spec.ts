import { describe, it, expect } from 'vitest';
import { FROTA_CRITERIA } from './frota.config';

describe('FROTA_CRITERIA', () => {
  it('should have 8 criteria', () => {
    expect(FROTA_CRITERIA).toHaveLength(8);
  });

  describe('ciot_em_dia', () => {
    const criterion = FROTA_CRITERIA.find(c => c.id === 'ciot_em_dia')!;

    it('CONFORME when all viagens em andamento have CIOT', () => {
      const entity = {
        viagens: [
          { status: 'EM_ANDAMENTO', ciotNumero: 'CIOT-001' },
          { status: 'EM_ANDAMENTO', ciotNumero: 'CIOT-002' },
        ],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME when no viagens have CIOT', () => {
      const entity = {
        viagens: [
          { status: 'EM_ANDAMENTO', ciotNumero: null },
          { status: 'EM_ANDAMENTO', ciotNumero: null },
        ],
      };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });

    it('PARCIAL when some viagens have CIOT', () => {
      const entity = {
        viagens: [
          { status: 'EM_ANDAMENTO', ciotNumero: 'CIOT-001' },
          { status: 'EM_ANDAMENTO', ciotNumero: null },
          { status: 'EM_ANDAMENTO', ciotNumero: 'CIOT-003' },
        ],
      };
      expect(criterion.evaluate(entity).status).toBe('PARCIAL');
    });

    it('NAO_APLICAVEL when no viagens em andamento', () => {
      const entity = { viagens: [{ status: 'CONCLUIDA' }] };
      expect(criterion.evaluate(entity).status).toBe('NAO_APLICAVEL');
    });
  });

  describe('cnh_motoristas', () => {
    const criterion = FROTA_CRITERIA.find(c => c.id === 'cnh_motoristas')!;

    it('CONFORME when all motoristas have valid CNH', () => {
      const entity = {
        motoristas: [
          { cnhValidade: new Date(Date.now() + 86400000).toISOString() },
          { cnhValidade: new Date(Date.now() + 86400000).toISOString() },
        ],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME when all CNHs are expired', () => {
      const entity = {
        motoristas: [{ cnhValidade: '2020-01-01' }],
      };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });

    it('NAO_APLICAVEL when no motoristas', () => {
      const entity = { motoristas: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_APLICAVEL');
    });
  });

  describe('documentacao_veicular', () => {
    const criterion = FROTA_CRITERIA.find(c => c.id === 'documentacao_veicular')!;

    it('CONFORME when all veiculos have valid docs', () => {
      const entity = {
        veiculos: [{ crlvValido: true, ipvaQuitado: true }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME when veiculos lack docs', () => {
      const entity = {
        veiculos: [{ crlvValido: false, ipvaQuitado: false }],
      };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });

    it('NAO_APLICAVEL when no veiculos', () => {
      const entity = { veiculos: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_APLICAVEL');
    });
  });

  describe('tacografo_aferido', () => {
    const criterion = FROTA_CRITERIA.find(c => c.id === 'tacografo_aferido')!;

    it('CONFORME when all tacografos are aferidos', () => {
      const entity = {
        veiculos: [
          { temTacografo: true, tacografoAferido: true, tacografoValidade: new Date(Date.now() + 86400000).toISOString() },
        ],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME when tacografos are not aferidos', () => {
      const entity = {
        veiculos: [{ temTacografo: true, tacografoAferido: false }],
      };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });

    it('NAO_APLICAVEL when no veiculos with tacografo', () => {
      const entity = { veiculos: [{ temTacografo: false }] };
      expect(criterion.evaluate(entity).status).toBe('NAO_APLICAVEL');
    });
  });

  describe('lei_descanso', () => {
    const criterion = FROTA_CRITERIA.find(c => c.id === 'lei_descanso')!;

    it('CONFORME when all em viagem motoristas are conformes', () => {
      const entity = {
        motoristas: [{ emViagem: true, descansoConforme: true }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME when motoristas do not comply', () => {
      const entity = {
        motoristas: [{ emViagem: true, descansoConforme: false }],
      };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });

    it('NAO_APLICAVEL when no motoristas em viagem', () => {
      const entity = { motoristas: [{ emViagem: false }] };
      expect(criterion.evaluate(entity).status).toBe('NAO_APLICAVEL');
    });
  });

  describe('manutencao_preventiva', () => {
    const criterion = FROTA_CRITERIA.find(c => c.id === 'manutencao_preventiva')!;

    it('CONFORME when all veiculos have manutencao em dia', () => {
      const entity = {
        veiculos: [{ manutencaoEmDia: true }, { manutencaoEmDia: true }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME when none have manutencao', () => {
      const entity = {
        veiculos: [{ manutencaoEmDia: false }],
      };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });

    it('NAO_APLICAVEL when no veiculos', () => {
      const entity = { veiculos: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_APLICAVEL');
    });
  });

  describe('seguro_obrigatorio', () => {
    const criterion = FROTA_CRITERIA.find(c => c.id === 'seguro_obrigatorio')!;

    it('CONFORME when all veiculos have valid seguro', () => {
      const entity = {
        veiculos: [{ seguroValido: true }, { seguroValido: true }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME when no seguro', () => {
      const entity = {
        veiculos: [{ seguroValido: false }],
      };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });

    it('NAO_APLICAVEL when no veiculos', () => {
      const entity = { veiculos: [] };
      expect(criterion.evaluate(entity).status).toBe('NAO_APLICAVEL');
    });
  });

  describe('curso_mopp', () => {
    const criterion = FROTA_CRITERIA.find(c => c.id === 'curso_mopp')!;

    it('CONFORME when all perigoso motoristas have MOPP', () => {
      const entity = {
        motoristas: [{ transportaPerigoso: true, moppValido: true }],
      };
      expect(criterion.evaluate(entity).status).toBe('CONFORME');
    });

    it('NAO_CONFORME when perigoso motoristas lack MOPP', () => {
      const entity = {
        motoristas: [{ transportaPerigoso: true, moppValido: false }],
      };
      expect(criterion.evaluate(entity).status).toBe('NAO_CONFORME');
    });

    it('NAO_APLICAVEL when no perigoso motoristas', () => {
      const entity = { motoristas: [{ transportaPerigoso: false }] };
      expect(criterion.evaluate(entity).status).toBe('NAO_APLICAVEL');
    });
  });
});
