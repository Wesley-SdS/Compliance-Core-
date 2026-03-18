import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { LaudoService } from './laudo.service';

// Mocks
function createMockDb() {
  return {
    query: vi.fn().mockResolvedValue([]),
    queryOne: vi.fn().mockResolvedValue(null),
  };
}

function createMockEventStore() {
  return {
    append: vi.fn().mockResolvedValue(undefined),
    getAuditTrail: vi.fn().mockResolvedValue([]),
  };
}

function createMockVektus() {
  return {
    injectSkills: vi.fn().mockResolvedValue({ context: 'ai context', tokens: 100 }),
    search: vi.fn().mockResolvedValue([{ content: 'Guideline de hemograma para valores criticos' }]),
  };
}

function createMockLogger() {
  return { setContext: vi.fn(), log: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

function createService() {
  const db = createMockDb();
  const eventStore = createMockEventStore();
  const vektus = createMockVektus();
  const logger = createMockLogger();
  const service = new LaudoService(db as any, eventStore as any, vektus as any, logger as any);
  return { service, db, eventStore, vektus };
}

const baseLaudo = {
  id: 'LAUDO001',
  laboratorio_id: 'LAB001',
  paciente_id: 'PAC001',
  tipo_exame: 'Hemograma',
  material_biologico: 'Sangue',
  metodologia: 'Automatizada',
  resultado: null,
  unidade: null,
  valor_referencia: null,
  observacoes: null,
  status: 'RASCUNHO',
  laudo_assinado: false,
  assinado_por: null,
  crbio_responsavel: null,
  liberado_at: null,
  resultados: null,
  revisao_ia: null,
  created_at: '2026-03-17T00:00:00Z',
  updated_at: '2026-03-17T00:00:00Z',
};

describe('LaudoService', () => {
  describe('create', () => {
    it('should create laudo with status RASCUNHO and emit event', async () => {
      const { service, db, eventStore } = createService();
      const dto = { laboratorioId: 'LAB001', tipoExame: 'Hemograma', materialBiologico: 'Sangue', metodologia: 'Automatizada' };

      db.queryOne.mockResolvedValue({ ...baseLaudo });

      const result = await service.create(dto as any, 'USER001');

      // INSERT query includes 'RASCUNHO'
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('RASCUNHO'),
        expect.arrayContaining(['LAB001']),
      );

      // Event emitted
      expect(eventStore.append).toHaveBeenCalledWith(
        'LAB001', 'laboratorio', 'LAUDO_CREATED',
        expect.objectContaining({ tipoExame: 'Hemograma' }),
        expect.objectContaining({ actorId: 'USER001', actorRole: 'biomedico' }),
      );

      expect(result).toBeDefined();
    });
  });

  describe('update — field-level event sourcing', () => {
    it('should emit CAMPO_ALTERADO for each changed field', async () => {
      const { service, db, eventStore } = createService();
      const existing = { ...baseLaudo, observacoes: 'old obs', status: 'RASCUNHO' };

      // findById returns existing laudo
      db.queryOne.mockResolvedValueOnce(existing).mockResolvedValueOnce({ ...existing, observacoes: 'new obs' });

      await service.update('LAUDO001', { observacoes: 'new obs' } as any, 'USER001');

      // Should emit CAMPO_ALTERADO event
      expect(eventStore.append).toHaveBeenCalledWith(
        'LAUDO001', 'laudo', 'CAMPO_ALTERADO',
        expect.objectContaining({
          campo: 'observacoes',
          valorAnterior: 'old obs',
          valorNovo: 'new obs',
        }),
        expect.objectContaining({ actorId: 'USER001' }),
      );
    });

    it('should emit LAUDO_UPDATED on laboratorio aggregate', async () => {
      const { service, db, eventStore } = createService();
      const existing = { ...baseLaudo, observacoes: 'old' };

      db.queryOne.mockResolvedValueOnce(existing).mockResolvedValueOnce({ ...existing, observacoes: 'new' });

      await service.update('LAUDO001', { observacoes: 'new' } as any, 'USER001');

      expect(eventStore.append).toHaveBeenCalledWith(
        'LAB001', 'laboratorio', 'LAUDO_UPDATED',
        expect.objectContaining({ laudoId: 'LAUDO001', changedFields: ['observacoes'] }),
        expect.any(Object),
      );
    });

    it('should not emit events when no fields changed', async () => {
      const { service, db, eventStore } = createService();
      const existing = { ...baseLaudo, observacoes: 'same' };

      db.queryOne.mockResolvedValue(existing);

      await service.update('LAUDO001', { observacoes: 'same' } as any, 'USER001');

      // No CAMPO_ALTERADO events
      const campoEvents = eventStore.append.mock.calls.filter(
        (c: any[]) => c[2] === 'CAMPO_ALTERADO',
      );
      expect(campoEvents).toHaveLength(0);
    });
  });

  describe('aiReview', () => {
    it('should use Vektus L3 (not L2)', async () => {
      const { service, db, vektus } = createService();
      db.queryOne.mockResolvedValue({ ...baseLaudo, resultados: [] });

      await service.aiReview('LAUDO001', 'USER001');

      expect(vektus.injectSkills).toHaveBeenCalledWith(
        'L3',
        expect.any(String),
        expect.objectContaining({ vertical: 'laudo' }),
      );
    });

    it('should return { alertas[] } shape', async () => {
      const { service, db } = createService();
      db.queryOne.mockResolvedValue({ ...baseLaudo, resultados: [] });

      const result = await service.aiReview('LAUDO001', 'USER001');

      expect(result).toHaveProperty('alertas');
      expect(Array.isArray(result.alertas)).toBe(true);
      expect(result).toHaveProperty('laudoId', 'LAUDO001');
    });

    it('should detect critical values above limit', async () => {
      const { service, db } = createService();
      const laudo = {
        ...baseLaudo,
        resultados: [
          { analito: 'Leucocitos', resultado: '25000', unidade: '/mm3', limiteCriticoAlto: 20000, flag: 'critico' },
        ],
      };
      db.queryOne.mockResolvedValue(laudo);

      const result = await service.aiReview('LAUDO001', 'USER001');

      const criticos = result.alertas.filter((a: any) => a.tipo === 'critico');
      expect(criticos.length).toBeGreaterThanOrEqual(1);
      expect(criticos[0].mensagem).toContain('Leucocitos');
      expect(criticos[0].mensagem).toContain('critico');
    });

    it('should detect Hb/Ht inconsistency', async () => {
      const { service, db } = createService();
      const laudo = {
        ...baseLaudo,
        resultados: [
          { analito: 'Hemoglobina', resultado: '15.8', unidade: 'g/dL', flag: 'normal' },
          { analito: 'Hematocrito', resultado: '35', unidade: '%', flag: 'normal' },
        ],
      };
      db.queryOne.mockResolvedValue(laudo);

      const result = await service.aiReview('LAUDO001', 'USER001');

      const inconsistencias = result.alertas.filter((a: any) => a.tipo === 'inconsistencia' && a.analito === 'Hemoglobina/Hematocrito');
      expect(inconsistencias.length).toBe(1);
      expect(inconsistencias[0].mensagem).toContain('inconsistente');
    });

    it('should include Vektus suggestions', async () => {
      const { service, db } = createService();
      db.queryOne.mockResolvedValue({ ...baseLaudo, resultados: [] });

      const result = await service.aiReview('LAUDO001', 'USER001');

      const sugestoes = result.alertas.filter((a: any) => a.tipo === 'sugestao');
      expect(sugestoes.length).toBe(1);
      expect(sugestoes[0].mensagem).toContain('guidelines');
    });

    it('should set status to EM_REVISAO', async () => {
      const { service, db } = createService();
      db.queryOne.mockResolvedValue({ ...baseLaudo, resultados: [] });

      await service.aiReview('LAUDO001', 'USER001');

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('EM_REVISAO'),
        expect.any(Array),
      );
    });
  });

  describe('liberarLaudo', () => {
    it('should set status LIBERADO + generate portal token + save CRBio', async () => {
      const { service, db, eventStore } = createService();
      const user = { id: 'USER001', name: 'Dr. Silva', role: 'bioquimico', crbio: 'CRBio-12345' } as any;

      db.queryOne.mockResolvedValueOnce({ ...baseLaudo, status: 'REVISADO' })
        .mockResolvedValueOnce({ ...baseLaudo, status: 'LIBERADO', laudo_assinado: true, assinado_por: 'Dr. Silva' });

      const result = await service.liberarLaudo('LAUDO001', user);

      // UPDATE sets LIBERADO + assinado_por + crbio
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('LIBERADO'),
        expect.arrayContaining(['Dr. Silva', 'CRBio-12345', 'LAUDO001']),
      );

      // Portal token created
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('portal_tokens'),
        expect.any(Array),
      );

      // LAUDO_LIBERADO event emitted on both laudo and lab
      const liberadoEvents = eventStore.append.mock.calls.filter(
        (c: any[]) => c[2] === 'LAUDO_LIBERADO',
      );
      expect(liberadoEvents.length).toBe(2);

      expect(result).toHaveProperty('portalToken');
    });

    it('should reject if laudo already LIBERADO', async () => {
      const { service, db } = createService();
      db.queryOne.mockResolvedValue({ ...baseLaudo, status: 'LIBERADO' });

      await expect(service.liberarLaudo('LAUDO001', { id: 'U1', role: 'bioquimico' } as any))
        .rejects.toThrow('Laudo ja liberado');
    });

    it('should reject if role is not bioquimico', async () => {
      const { service, db } = createService();
      db.queryOne.mockResolvedValue({ ...baseLaudo, status: 'REVISADO' });

      await expect(service.liberarLaudo('LAUDO001', { id: 'U1', role: 'tecnico' } as any))
        .rejects.toThrow('Somente bioquimico');
    });
  });

  describe('getHistorico', () => {
    it('should return events filtered by laudoId', async () => {
      const { service, db, eventStore } = createService();
      db.queryOne.mockResolvedValue(baseLaudo);
      eventStore.getAuditTrail.mockResolvedValue([
        { id: 'E1', type: 'CAMPO_ALTERADO', title: 'Observacoes alteradas' },
      ]);

      const result = await service.getHistorico('LAUDO001');

      expect(eventStore.getAuditTrail).toHaveBeenCalledWith(
        expect.objectContaining({ aggregateId: 'LAUDO001', aggregateType: 'laudo' }),
      );
      expect(result).toHaveLength(1);
    });

    it('should throw if laudo not found', async () => {
      const { service, db } = createService();
      db.queryOne.mockResolvedValue(null);

      await expect(service.getHistorico('NOTFOUND'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('generatePdf', () => {
    it('should send non-empty content', async () => {
      const { service, db } = createService();
      db.queryOne
        .mockResolvedValueOnce({ ...baseLaudo, tipo_exame: 'Hemograma', material_biologico: 'Sangue' })
        .mockResolvedValueOnce({ nome: 'Lab Teste', cnpj: '12345678000199', crbm: 'CRBio-001' });

      const res = {
        setHeader: vi.fn(),
        send: vi.fn(),
      };

      await service.generatePdf('LAUDO001', res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain; charset=utf-8');
      expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Lab Teste'));
      expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Hemograma'));
      expect(res.send).toHaveBeenCalledWith(expect.stringContaining('LAUDO001'));

      const content = res.send.mock.calls[0][0];
      expect(content.length).toBeGreaterThan(50);
    });
  });

  describe('aiReviewAction', () => {
    it('should emit AI_ALERTA_ACEITO event', async () => {
      const { service, db, eventStore } = createService();
      db.queryOne.mockResolvedValue(baseLaudo);

      await service.aiReviewAction('LAUDO001', { alertaId: 'A1', acao: 'aceitar', analito: 'Leucocitos' }, 'USER001');

      expect(eventStore.append).toHaveBeenCalledWith(
        'LAUDO001', 'laudo', 'AI_ALERTA_ACEITO',
        expect.objectContaining({ alertaId: 'A1', acao: 'aceitar' }),
        expect.any(Object),
      );
    });

    it('should emit AI_ALERTA_IGNORADO event', async () => {
      const { service, db, eventStore } = createService();
      db.queryOne.mockResolvedValue(baseLaudo);

      await service.aiReviewAction('LAUDO001', { alertaId: 'A2', acao: 'ignorar' }, 'USER001');

      expect(eventStore.append).toHaveBeenCalledWith(
        'LAUDO001', 'laudo', 'AI_ALERTA_IGNORADO',
        expect.objectContaining({ alertaId: 'A2' }),
        expect.any(Object),
      );
    });
  });
});
