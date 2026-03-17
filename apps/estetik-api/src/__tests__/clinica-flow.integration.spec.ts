import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock SDK services
const mockEventStore = {
  append: vi.fn().mockResolvedValue(undefined),
  getEvents: vi.fn().mockResolvedValue([]),
  getAuditTrail: vi.fn().mockResolvedValue({ events: [], total: 0, page: 1, limit: 20 }),
};

const mockScoreEngine = {
  calculate: vi.fn().mockResolvedValue({
    id: 'score-1',
    aggregateId: 'clinica-1',
    overall: 75,
    level: 'BOM',
    breakdown: [],
    trend: 'ESTAVEL',
    calculatedAt: new Date(),
  }),
};

const mockAlertEngine = {
  register: vi.fn().mockResolvedValue('alert-1'),
  getUpcoming: vi.fn().mockResolvedValue([]),
  checkDue: vi.fn().mockResolvedValue([]),
};

const mockDb = {
  query: vi.fn().mockResolvedValue([]),
  queryOne: vi.fn().mockResolvedValue(null),
  transaction: vi.fn().mockImplementation((fn: any) => fn(vi.fn().mockResolvedValue([]))),
};

vi.mock('@compliancecore/sdk', () => ({
  EventStoreService: vi.fn().mockImplementation(() => mockEventStore),
  ScoreEngineService: vi.fn().mockImplementation(() => mockScoreEngine),
  AlertEngineService: vi.fn().mockImplementation(() => mockAlertEngine),
  DatabaseService: vi.fn().mockImplementation(() => mockDb),
  ComplianceCoreConfigService: vi.fn(),
  ComplianceLogger: vi.fn(),
  ClerkAuthGuard: vi.fn().mockImplementation(() => ({ canActivate: () => true })),
  CurrentUser: () => () => {},
  AuthUser: vi.fn(),
  VektusWebhookGuard: vi.fn().mockImplementation(() => ({ canActivate: () => true })),
  VektusAdapterService: vi.fn(),
  LegislationMonitorService: vi.fn(),
}));

import { ClinicaService } from '../modules/clinica/clinica.service';

describe('Clinica Integration Flow', () => {
  let service: ClinicaService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ClinicaService(
      mockEventStore as any,
      mockScoreEngine as any,
      mockAlertEngine as any,
      mockDb as any,
    );
  });

  describe('Cadastro → Upload → Score → Dossie flow', () => {
    it('should create a clinica and emit event', async () => {
      const dto = {
        nome: 'Clinica Beleza Pura',
        cnpj: '12.345.678/0001-99',
        endereco: 'Rua das Flores, 123',
        email: 'contato@belezapura.com',
      };

      const result = await service.create(dto as any, 'user-1');

      expect(result.nome).toBe('Clinica Beleza Pura');
      expect(result.cnpj).toBe('12.345.678/0001-99');
      expect(result.id).toBeDefined();
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO clinicas'),
        expect.any(Array),
      );
      expect(mockEventStore.append).toHaveBeenCalledWith(
        expect.any(String),
        'Clinica',
        'CLINICA_CREATED',
        expect.objectContaining({ nome: 'Clinica Beleza Pura' }),
        expect.objectContaining({ actorId: 'user-1' }),
      );
    });

    it('should upload document and register alert for expiring docs', async () => {
      // Mock findOne
      mockDb.queryOne.mockResolvedValueOnce({
        data: { id: 'clinica-1', nome: 'Test Clinica' },
      });

      const dto = {
        fileName: 'alvara-2025.pdf',
        fileKey: 'estetik/clinica-1/alvara-2025.pdf',
        fileSize: 102400,
        mimeType: 'application/pdf',
        category: 'alvara',
        expiresAt: '2025-12-31',
      };

      const doc = await service.uploadDocument('clinica-1', dto as any, 'user-1');

      expect(doc.fileName).toBe('alvara-2025.pdf');
      expect(doc.category).toBe('alvara');
      expect(mockAlertEngine.register).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: 'clinica-1',
          alertType: 'DOC_EXPIRY',
          daysBeforeAlert: [30, 15, 7, 1],
        }),
      );
      expect(mockEventStore.append).toHaveBeenCalledWith(
        'clinica-1',
        'Clinica',
        'DOCUMENT_UPLOADED',
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should calculate score using SDK ScoreEngine', async () => {
      mockDb.queryOne.mockResolvedValueOnce({
        data: { id: 'clinica-1', nome: 'Test Clinica', documents: [], equipamentos: [] },
      });

      const score = await service.calculateScore('clinica-1');

      expect(score.overall).toBe(75);
      expect(score.level).toBe('BOM');
      expect(mockScoreEngine.calculate).toHaveBeenCalledWith(
        'clinica-1',
        expect.any(Array), // ESTETIK_CRITERIA
        expect.objectContaining({ id: 'clinica-1' }),
      );
      expect(mockEventStore.append).toHaveBeenCalledWith(
        'clinica-1',
        'Clinica',
        'SCORE_CALCULATED',
        expect.objectContaining({ overall: 75, level: 'BOM' }),
        expect.any(Object),
      );
    });

    it('should generate dossier with score and documents', async () => {
      // Mock findOne
      mockDb.queryOne
        .mockResolvedValueOnce({ data: { id: 'clinica-1', nome: 'Test', cnpj: '123' } })
        // Mock getScore
        .mockResolvedValueOnce({ data: { overall: 80, level: 'BOM', breakdown: [] } });
      // Mock getDocuments
      mockDb.query.mockResolvedValueOnce([
        { data: { id: 'doc-1', fileName: 'alvara.pdf' } },
        { data: { id: 'doc-2', fileName: 'licenca.pdf' } },
      ]);

      const result = await service.generateDossier('clinica-1', 'user-1');

      expect(result.dossierId).toBeDefined();
      expect(result.status).toBe('generated');
      expect(mockEventStore.append).toHaveBeenCalledWith(
        'clinica-1',
        'Clinica',
        'DOSSIER_GENERATED',
        expect.objectContaining({ documentsIncluded: 2 }),
        expect.any(Object),
      );
    });

    it('should get alerts via AlertEngine.getUpcoming', async () => {
      mockDb.queryOne.mockResolvedValueOnce({ data: { id: 'clinica-1' } });
      mockAlertEngine.getUpcoming.mockResolvedValueOnce([
        {
          id: 'alert-1',
          entityId: 'clinica-1',
          alertType: 'DOC_EXPIRY',
          dueDate: new Date('2025-06-30'),
          daysUntilDue: 30,
          status: 'PENDING',
          channels: ['in_app'],
        },
      ]);

      const alerts = await service.getAlerts('clinica-1');

      expect(alerts).toHaveLength(1);
      expect(alerts[0].alertType).toBe('DOC_EXPIRY');
      expect(mockAlertEngine.getUpcoming).toHaveBeenCalledWith('clinica-1', 90);
    });
  });
});
