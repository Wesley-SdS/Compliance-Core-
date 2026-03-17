import { http, HttpResponse, delay } from 'msw';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const clinicas = [
  {
    id: 'cli-001',
    nome: 'Clínica Estética Bella Vita',
    cnpj: '12.345.678/0001-90',
    endereco: 'Rua Augusta, 1200 - Consolação, São Paulo - SP',
    telefone: '(11) 3456-7890',
    email: 'contato@bellavita.com.br',
    responsavelTecnico: 'Dra. Maria Fernanda Costa',
    crmResponsavel: 'CRM/SP 123456',
    status: 'ativa',
    scoreAtual: 72,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2026-03-10T14:30:00Z',
  },
  {
    id: 'cli-002',
    nome: 'Dermaclínica Premium',
    cnpj: '98.765.432/0001-10',
    endereco: 'Av. Paulista, 800 - Bela Vista, São Paulo - SP',
    telefone: '(11) 2345-6789',
    email: 'admin@dermaclinica.com.br',
    responsavelTecnico: 'Dr. João Paulo Almeida',
    crmResponsavel: 'CRM/SP 654321',
    status: 'ativa',
    scoreAtual: 85,
    createdAt: '2023-06-20T08:00:00Z',
    updatedAt: '2026-03-12T09:15:00Z',
  },
  {
    id: 'cli-003',
    nome: 'Espaço Harmony Estética',
    cnpj: '11.222.333/0001-44',
    endereco: 'Rua Oscar Freire, 450 - Jardins, São Paulo - SP',
    telefone: '(11) 4567-8901',
    email: 'harmony@harmonyestetica.com.br',
    responsavelTecnico: 'Dra. Ana Beatriz Oliveira',
    crmResponsavel: 'CRM/SP 789012',
    status: 'pendente',
    scoreAtual: 58,
    createdAt: '2024-09-01T12:00:00Z',
    updatedAt: '2026-03-08T16:45:00Z',
  },
];

const scoreData = {
  clinicaId: 'cli-001',
  scoreTotal: 72,
  classificacao: 'BOM',
  calculadoEm: '2026-03-10T14:30:00Z',
  breakdown: [
    { criterio: 'Alvará Sanitário', peso: 20, score: 20, status: 'conforme' },
    { criterio: 'Licença ANVISA', peso: 15, score: 12, status: 'parcial' },
    { criterio: 'POPs Atualizados', peso: 15, score: 10, status: 'parcial' },
    { criterio: 'Treinamento Equipe', peso: 10, score: 8, status: 'conforme' },
    { criterio: 'Gestão de Resíduos (PGRSS)', peso: 15, score: 10, status: 'parcial' },
    { criterio: 'Equipamentos Calibrados', peso: 10, score: 7, status: 'conforme' },
    { criterio: 'Documentação Profissional', peso: 15, score: 5, status: 'irregular' },
  ],
};

const documents = [
  {
    id: 'doc-001',
    nome: 'Alvará Sanitário Municipal',
    categoria: 'licenca',
    status: 'valido',
    dataUpload: '2025-08-15T10:00:00Z',
    dataValidade: '2026-08-15T00:00:00Z',
    clinicaId: 'cli-001',
    tamanho: 245000,
    tipo: 'application/pdf',
  },
  {
    id: 'doc-002',
    nome: 'AFE - Autorização de Funcionamento ANVISA',
    categoria: 'licenca',
    status: 'vencendo',
    dataUpload: '2024-04-10T14:00:00Z',
    dataValidade: '2026-04-10T00:00:00Z',
    clinicaId: 'cli-001',
    tamanho: 189000,
    tipo: 'application/pdf',
  },
  {
    id: 'doc-003',
    nome: 'PGRSS - Plano de Gerenciamento de Resíduos',
    categoria: 'plano',
    status: 'valido',
    dataUpload: '2025-11-20T09:00:00Z',
    dataValidade: '2026-11-20T00:00:00Z',
    clinicaId: 'cli-001',
    tamanho: 512000,
    tipo: 'application/pdf',
  },
  {
    id: 'doc-004',
    nome: 'Certificado de Calibração - Laser Nd:YAG',
    categoria: 'equipamento',
    status: 'vencido',
    dataUpload: '2024-12-01T11:00:00Z',
    dataValidade: '2025-12-01T00:00:00Z',
    clinicaId: 'cli-001',
    tamanho: 98000,
    tipo: 'application/pdf',
  },
  {
    id: 'doc-005',
    nome: 'AVCB - Auto de Vistoria do Corpo de Bombeiros',
    categoria: 'seguranca',
    status: 'valido',
    dataUpload: '2025-06-01T08:00:00Z',
    dataValidade: '2027-06-01T00:00:00Z',
    clinicaId: 'cli-001',
    tamanho: 340000,
    tipo: 'application/pdf',
  },
];

const checklist = {
  clinicaId: 'cli-001',
  items: [
    { id: 'chk-01', descricao: 'Alvará sanitário vigente', completo: true, obrigatorio: true },
    { id: 'chk-02', descricao: 'AFE ANVISA atualizada', completo: false, obrigatorio: true },
    { id: 'chk-03', descricao: 'PGRSS aprovado pela vigilância sanitária', completo: true, obrigatorio: true },
    { id: 'chk-04', descricao: 'POPs de todos os procedimentos', completo: false, obrigatorio: true },
    { id: 'chk-05', descricao: 'Certificados de calibração dos equipamentos', completo: false, obrigatorio: true },
    { id: 'chk-06', descricao: 'Registro de treinamentos da equipe', completo: true, obrigatorio: true },
    { id: 'chk-07', descricao: 'AVCB válido', completo: true, obrigatorio: true },
    { id: 'chk-08', descricao: 'Contratos com laboratórios terceirizados', completo: true, obrigatorio: false },
    { id: 'chk-09', descricao: 'Fichas de anamnese padronizadas', completo: true, obrigatorio: false },
    { id: 'chk-10', descricao: 'Termos de consentimento atualizados', completo: false, obrigatorio: true },
  ],
};

const timeline = [
  { id: 'evt-01', tipo: 'documento', descricao: 'Alvará sanitário renovado', data: '2025-08-15T10:00:00Z', usuario: 'Dra. Maria Fernanda' },
  { id: 'evt-02', tipo: 'score', descricao: 'Score de compliance recalculado: 72 (BOM)', data: '2026-03-10T14:30:00Z', usuario: 'Sistema' },
  { id: 'evt-03', tipo: 'alerta', descricao: 'Alerta: AFE ANVISA vencendo em 30 dias', data: '2026-03-10T08:00:00Z', usuario: 'Sistema' },
  { id: 'evt-04', tipo: 'pop', descricao: 'POP de Harmonização Facial aprovado', data: '2026-02-28T16:00:00Z', usuario: 'Dr. Carlos Silva' },
  { id: 'evt-05', tipo: 'auditoria', descricao: 'Auditoria interna realizada', data: '2026-02-15T09:00:00Z', usuario: 'Consultoria CompliancePro' },
  { id: 'evt-06', tipo: 'documento', descricao: 'PGRSS atualizado e aprovado', data: '2025-11-20T09:00:00Z', usuario: 'Dra. Maria Fernanda' },
  { id: 'evt-07', tipo: 'treinamento', descricao: 'Treinamento de biossegurança concluído', data: '2025-10-05T14:00:00Z', usuario: 'Equipe Técnica' },
  { id: 'evt-08', tipo: 'legislacao', descricao: 'Nova RDC ANVISA analisada - sem impacto', data: '2025-09-20T11:00:00Z', usuario: 'Sistema' },
  { id: 'evt-09', tipo: 'equipamento', descricao: 'Laser Nd:YAG calibrado', data: '2024-12-01T11:00:00Z', usuario: 'TechMed Calibrações' },
  { id: 'evt-10', tipo: 'documento', descricao: 'AVCB renovado', data: '2025-06-01T08:00:00Z', usuario: 'Corpo de Bombeiros' },
];

const clinicAlerts = [
  { id: 'alt-c01', tipo: 'vencimento', severidade: 'alta', mensagem: 'AFE ANVISA vence em 25 dias', clinicaId: 'cli-001', criadoEm: '2026-03-10T08:00:00Z', status: 'ativo' },
  { id: 'alt-c02', tipo: 'documento', severidade: 'critica', mensagem: 'Certificado de calibração do Laser Nd:YAG vencido', clinicaId: 'cli-001', criadoEm: '2025-12-02T08:00:00Z', status: 'ativo' },
  { id: 'alt-c03', tipo: 'compliance', severidade: 'media', mensagem: 'Termos de consentimento precisam de atualização', clinicaId: 'cli-001', criadoEm: '2026-03-01T10:00:00Z', status: 'ativo' },
];

const alertas = [
  { id: 'alt-001', tipo: 'vencimento', severidade: 'critica', mensagem: 'Certificado de calibração Laser Nd:YAG vencido há 105 dias', clinicaId: 'cli-001', clinicaNome: 'Clínica Estética Bella Vita', criadoEm: '2025-12-02T08:00:00Z', status: 'ativo' },
  { id: 'alt-002', tipo: 'vencimento', severidade: 'alta', mensagem: 'AFE ANVISA vence em 25 dias', clinicaId: 'cli-001', clinicaNome: 'Clínica Estética Bella Vita', criadoEm: '2026-03-10T08:00:00Z', status: 'ativo' },
  { id: 'alt-003', tipo: 'legislacao', severidade: 'media', mensagem: 'Nova RDC 786/2023 - Verificar adequação de procedimentos injetáveis', clinicaId: 'cli-002', clinicaNome: 'Dermaclínica Premium', criadoEm: '2026-03-05T10:00:00Z', status: 'ativo' },
  { id: 'alt-004', tipo: 'compliance', severidade: 'alta', mensagem: 'Score de compliance abaixo de 60 - ação corretiva necessária', clinicaId: 'cli-003', clinicaNome: 'Espaço Harmony Estética', criadoEm: '2026-03-08T16:45:00Z', status: 'ativo' },
  { id: 'alt-005', tipo: 'documento', severidade: 'baixa', mensagem: 'Contrato com laboratório de análises vence em 90 dias', clinicaId: 'cli-002', clinicaNome: 'Dermaclínica Premium', criadoEm: '2026-03-01T09:00:00Z', status: 'reconhecido' },
];

const documentos = [
  { id: 'doc-g01', nome: 'Alvará Sanitário - Bella Vita', categoria: 'licenca', status: 'valido', clinicaId: 'cli-001', clinicaNome: 'Clínica Estética Bella Vita', dataValidade: '2026-08-15T00:00:00Z' },
  { id: 'doc-g02', nome: 'AFE ANVISA - Bella Vita', categoria: 'licenca', status: 'vencendo', clinicaId: 'cli-001', clinicaNome: 'Clínica Estética Bella Vita', dataValidade: '2026-04-10T00:00:00Z' },
  { id: 'doc-g03', nome: 'PGRSS - Bella Vita', categoria: 'plano', status: 'valido', clinicaId: 'cli-001', clinicaNome: 'Clínica Estética Bella Vita', dataValidade: '2026-11-20T00:00:00Z' },
  { id: 'doc-g04', nome: 'Alvará Sanitário - Dermaclínica', categoria: 'licenca', status: 'valido', clinicaId: 'cli-002', clinicaNome: 'Dermaclínica Premium', dataValidade: '2027-02-10T00:00:00Z' },
  { id: 'doc-g05', nome: 'AFE ANVISA - Dermaclínica', categoria: 'licenca', status: 'valido', clinicaId: 'cli-002', clinicaNome: 'Dermaclínica Premium', dataValidade: '2027-01-20T00:00:00Z' },
  { id: 'doc-g06', nome: 'Certificado Calibração IPL - Dermaclínica', categoria: 'equipamento', status: 'valido', clinicaId: 'cli-002', clinicaNome: 'Dermaclínica Premium', dataValidade: '2026-09-15T00:00:00Z' },
  { id: 'doc-g07', nome: 'Alvará Sanitário - Harmony', categoria: 'licenca', status: 'vencido', clinicaId: 'cli-003', clinicaNome: 'Espaço Harmony Estética', dataValidade: '2026-01-01T00:00:00Z' },
  { id: 'doc-g08', nome: 'AVCB - Harmony', categoria: 'seguranca', status: 'vencendo', clinicaId: 'cli-003', clinicaNome: 'Espaço Harmony Estética', dataValidade: '2026-04-30T00:00:00Z' },
];

const pops = [
  {
    id: 'pop-001',
    titulo: 'POP - Aplicação de Toxina Botulínica',
    procedimentoTipo: 'toxina_botulinica',
    clinicaId: 'cli-001',
    versao: '2.1',
    status: 'aprovado',
    aprovadoPor: 'Dra. Maria Fernanda Costa',
    aprovadoEm: '2026-01-15T10:00:00Z',
    conteudo: '# POP - Aplicação de Toxina Botulínica\n\n## 1. Objetivo\nPadronizar o procedimento de aplicação de toxina botulínica...\n\n## 2. Materiais\n- Toxina botulínica (marca aprovada ANVISA)\n- Seringas de insulina\n- Gaze estéril\n- Clorexidina 2%\n\n## 3. Procedimento\n1. Verificar anamnese e consentimento\n2. Higienizar a área\n3. Realizar marcações\n4. Aplicar conforme protocolo...',
    criadoEm: '2025-12-01T08:00:00Z',
    atualizadoEm: '2026-01-15T10:00:00Z',
  },
  {
    id: 'pop-002',
    titulo: 'POP - Preenchimento com Ácido Hialurônico',
    procedimentoTipo: 'acido_hialuronico',
    clinicaId: 'cli-001',
    versao: '1.3',
    status: 'aprovado',
    aprovadoPor: 'Dr. Carlos Silva',
    aprovadoEm: '2026-02-28T16:00:00Z',
    conteudo: '# POP - Preenchimento com Ácido Hialurônico\n\n## 1. Objetivo\nEstabelecer protocolo seguro para preenchimento dérmico...',
    criadoEm: '2025-10-15T09:00:00Z',
    atualizadoEm: '2026-02-28T16:00:00Z',
  },
  {
    id: 'pop-003',
    titulo: 'POP - Peeling Químico',
    procedimentoTipo: 'peeling',
    clinicaId: 'cli-001',
    versao: '1.0',
    status: 'rascunho',
    aprovadoPor: null,
    aprovadoEm: null,
    conteudo: '# POP - Peeling Químico\n\n## 1. Objetivo\nDefinir protocolo para realização de peeling químico...',
    criadoEm: '2026-03-05T14:00:00Z',
    atualizadoEm: '2026-03-05T14:00:00Z',
  },
];

const legislacao = [
  {
    id: 'leg-001',
    titulo: 'RDC 786/2023 - Boas Práticas em Serviços de Saúde',
    orgao: 'ANVISA',
    dataPublicacao: '2023-12-15T00:00:00Z',
    dataVigor: '2024-06-15T00:00:00Z',
    resumo: 'Atualiza normas de boas práticas para serviços de saúde, incluindo clínicas de estética. Novas exigências para documentação de procedimentos injetáveis.',
    impacto: 'alto',
    status: 'vigente',
    reconhecido: false,
  },
  {
    id: 'leg-002',
    titulo: 'Portaria CVS 1/2024 - Vigilância Sanitária SP',
    orgao: 'CVS/SP',
    dataPublicacao: '2024-03-01T00:00:00Z',
    dataVigor: '2024-09-01T00:00:00Z',
    resumo: 'Novas regras para descarte de resíduos de saúde no estado de São Paulo. Alterações no PGRSS obrigatório.',
    impacto: 'medio',
    status: 'vigente',
    reconhecido: true,
  },
  {
    id: 'leg-003',
    titulo: 'Resolução CFM 2.336/2023 - Procedimentos Estéticos',
    orgao: 'CFM',
    dataPublicacao: '2023-09-20T00:00:00Z',
    dataVigor: '2024-01-01T00:00:00Z',
    resumo: 'Define quais procedimentos estéticos são atos médicos exclusivos e quais podem ser realizados por outros profissionais habilitados.',
    impacto: 'alto',
    status: 'vigente',
    reconhecido: true,
  },
  {
    id: 'leg-004',
    titulo: 'Lei 14.879/2024 - Marco Regulatório Estética',
    orgao: 'Presidência da República',
    dataPublicacao: '2024-08-10T00:00:00Z',
    dataVigor: '2025-02-10T00:00:00Z',
    resumo: 'Estabelece o marco regulatório nacional para serviços de estética, definindo categorias de procedimentos e requisitos mínimos.',
    impacto: 'critico',
    status: 'vigente',
    reconhecido: false,
  },
];

const procedimentos = [
  { id: 'proc-01', nome: 'Toxina Botulínica', tipo: 'toxina_botulinica', categoria: 'injetavel', risco: 'medio' },
  { id: 'proc-02', nome: 'Preenchimento com Ácido Hialurônico', tipo: 'acido_hialuronico', categoria: 'injetavel', risco: 'medio' },
  { id: 'proc-03', nome: 'Peeling Químico', tipo: 'peeling', categoria: 'facial', risco: 'baixo' },
  { id: 'proc-04', nome: 'Laser CO2 Fracionado', tipo: 'laser_co2', categoria: 'laser', risco: 'alto' },
  { id: 'proc-05', nome: 'Microagulhamento', tipo: 'microagulhamento', categoria: 'facial', risco: 'baixo' },
  { id: 'proc-06', nome: 'Criolipólise', tipo: 'criolipolise', categoria: 'corporal', risco: 'baixo' },
];

export const handlers = [
  // Clinicas
  http.get(`${API_URL}/clinicas`, () => {
    return HttpResponse.json(clinicas);
  }),

  http.get(`${API_URL}/clinicas/:id`, ({ params }) => {
    const clinica = clinicas.find((c) => c.id === params.id);
    if (!clinica) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(clinica);
  }),

  http.get(`${API_URL}/clinicas/:id/score`, () => {
    return HttpResponse.json(scoreData);
  }),

  http.get(`${API_URL}/clinicas/:id/documents`, () => {
    return HttpResponse.json(documents);
  }),

  http.get(`${API_URL}/clinicas/:id/checklist`, () => {
    return HttpResponse.json(checklist);
  }),

  http.get(`${API_URL}/clinicas/:id/timeline`, () => {
    return HttpResponse.json(timeline);
  }),

  http.get(`${API_URL}/clinicas/:id/alerts`, () => {
    return HttpResponse.json(clinicAlerts);
  }),

  http.post(`${API_URL}/clinicas/:id/score/calculate`, () => {
    return HttpResponse.json({
      ...scoreData,
      scoreTotal: 75,
      calculadoEm: new Date().toISOString(),
    });
  }),

  http.post(`${API_URL}/clinicas/:id/documents`, () => {
    return HttpResponse.json({
      id: 'doc-new-' + Date.now(),
      nome: 'Novo Documento',
      categoria: 'licenca',
      status: 'valido',
      dataUpload: new Date().toISOString(),
      dataValidade: '2027-01-01T00:00:00Z',
    });
  }),

  http.post(`${API_URL}/clinicas/:id/dossier`, () => {
    return HttpResponse.json({
      url: '/dossier/dossier-' + Date.now() + '.pdf',
    });
  }),

  // Alertas
  http.get(`${API_URL}/alertas`, () => {
    return HttpResponse.json(alertas);
  }),

  http.post(`${API_URL}/alertas/:id/acknowledge`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Documentos
  http.get(`${API_URL}/documentos`, () => {
    return HttpResponse.json(documentos);
  }),

  // POPs
  http.get(`${API_URL}/pops`, () => {
    return HttpResponse.json(pops);
  }),

  http.get(`${API_URL}/pops/:id`, ({ params }) => {
    const pop = pops.find((p) => p.id === params.id);
    if (!pop) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(pop);
  }),

  http.post(`${API_URL}/pops/generate`, async () => {
    await delay(2000);
    return HttpResponse.json({
      id: 'pop-new-' + Date.now(),
      titulo: 'POP - Procedimento Gerado por IA',
      procedimentoTipo: 'laser_co2',
      versao: '1.0',
      status: 'rascunho',
      conteudo:
        '# POP - Laser CO2 Fracionado\n\n## 1. Objetivo\nEstabelecer protocolo seguro para procedimento de laser CO2 fracionado.\n\n## 2. Indicações\n- Rejuvenescimento facial\n- Cicatrizes de acne\n- Manchas solares\n\n## 3. Contraindicações\n- Gestantes\n- Uso de isotretinoína nos últimos 6 meses\n- Infecções ativas na área\n\n## 4. Materiais\n- Equipamento laser CO2 fracionado calibrado\n- Anestésico tópico (lidocaína 4%)\n- Gaze estéril\n- Protetor ocular\n\n## 5. Procedimento\n1. Avaliar anamnese e consentimento informado\n2. Fotografar área (pré-procedimento)\n3. Aplicar anestésico tópico - aguardar 30 min\n4. Posicionar proteção ocular\n5. Configurar parâmetros do laser\n6. Realizar aplicação em passes uniformes\n7. Aplicar creme cicatrizante\n8. Orientar cuidados pós-procedimento\n\n## 6. Cuidados Pós-Procedimento\n- Evitar exposição solar por 30 dias\n- Usar FPS 50+ diariamente\n- Hidratação constante da pele\n- Retorno em 7 dias para avaliação',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      aprovadoPor: null,
      aprovadoEm: null,
    });
  }),

  http.put(`${API_URL}/pops/:id/approve`, ({ params }) => {
    const pop = pops.find((p) => p.id === params.id);
    return HttpResponse.json({
      ...(pop || {}),
      status: 'aprovado',
      aprovadoPor: 'Usuário Atual',
      aprovadoEm: new Date().toISOString(),
    });
  }),

  // Legislação
  http.get(`${API_URL}/legislacao`, () => {
    return HttpResponse.json(legislacao);
  }),

  http.get(`${API_URL}/legislacao/:id/impact/:clinicaId`, ({ params }) => {
    return HttpResponse.json({
      legislacaoId: params.id,
      clinicaId: params.clinicaId,
      impacto: 'alto',
      areasAfetadas: ['Documentação', 'POPs', 'Treinamento'],
      acoesNecessarias: [
        'Atualizar POPs de procedimentos injetáveis',
        'Revisar termos de consentimento',
        'Agendar treinamento de equipe sobre novas normas',
      ],
      prazo: '2026-06-15T00:00:00Z',
    });
  }),

  http.post(`${API_URL}/legislacao/:id/acknowledge`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Procedimentos
  http.get(`${API_URL}/procedimentos`, () => {
    return HttpResponse.json(procedimentos);
  }),
];
