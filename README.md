<p align="center">
  <img src=".github/assets/logo.svg" alt="ComplianceCore" width="80" height="80" />
</p>

<h1 align="center">ComplianceCore</h1>

<p align="center">
  <strong>Plataforma de Compliance & Governança para o Brasil</strong>
</p>

<p align="center">
  Uma plataforma que transforma compliance de reativo em proativo.<br/>
  6 verticais setoriais · 1 SDK compartilhado · Audit trail imutável · Powered by Vektus RAG/OCR
</p>

<p align="center">
  <a href="#o-problema">O Problema</a> ·
  <a href="#a-solução">A Solução</a> ·
  <a href="#verticais">Verticais</a> ·
  <a href="#compliancecore-sdk">SDK</a> ·
  <a href="#arquitetura">Arquitetura</a> ·
  <a href="#features-compartilhadas">Features</a> ·
  <a href="#vektus-integration">Vektus</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#stack-tecnológica">Stack</a> ·
  <a href="#roadmap">Roadmap</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React_Native-Expo_52-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/PostgreSQL-16_+_pgvector-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Event_Sourcing-Audit_Trail-FF6B35?style=flat-square" />
  <img src="https://img.shields.io/badge/Vektus-RAG%2FOCR-8B5CF6?style=flat-square" />
  <img src="https://img.shields.io/badge/License-Proprietary-333?style=flat-square" />
</p>

---

<h2 id="o-problema">O Problema</h2>

O Brasil tem uma das estruturas regulatórias mais complexas do mundo. Anvisa, ANTT, Receita Federal, CREAs, CRMs, vigilâncias sanitárias municipais e estaduais — cada setor opera sob dezenas de normas que mudam frequentemente.

Pequenos e médios negócios — clínicas de estética, construtoras, escritórios contábeis, laboratórios, transportadores autônomos, loteadores — operam sem consultoria regulatória. O controle de compliance é feito com planilhas Excel, pastas no Google Drive e mensagens no WhatsApp. Documentos vencem sem aviso, normas mudam sem que ninguém perceba, e quando a fiscalização chega, não existe evidência organizada de conformidade.

O resultado é previsível: multas que podem ultrapassar dezenas de milhares de reais, interdições que paralisam a operação, e exposição jurídica que pode comprometer o negócio inteiro.

<h2 id="a-solução">A Solução</h2>

ComplianceCore é uma plataforma que automatiza o ciclo completo de compliance para 6 setores da economia brasileira. Em vez de reagir à fiscalização, o negócio opera proativamente — sabendo em tempo real seu nível de conformidade, recebendo alertas antes que documentos vençam, e tendo um dossiê de auditoria pronto para apresentar ao fiscal a qualquer momento.

O diferencial arquitetural é o **ComplianceCore SDK** — um conjunto de módulos compartilhados que resolve 70% de cada vertical. Cada produto setorial herda o motor de compliance completo (audit trail imutável, score de conformidade, alertas, monitor de legislação, dossiê de auditoria) e adiciona apenas a lógica regulatória específica do seu setor.

O motor de inteligência é o **Vektus** — uma plataforma RAG/OCR que indexa toda a legislação de cada setor, permite busca semântica em normas e documentos, e alimenta uma IA que gera checklists, POPs e análises de impacto regulatório automaticamente.

---

<h2 id="verticais">As 6 Verticais</h2>

<br/>

### 🏥 EstetikComply — Compliance para Clínicas de Estética

O setor de estética movimenta R$50 bilhões por ano no Brasil e é o mais denunciado na Anvisa — 61,3% de todas as denúncias em serviços de interesse à saúde. Na operação "Estética com Segurança" de 2025, irregularidades foram encontradas em 100% dos estabelecimentos vistoriados no primeiro dia. Clínicas pequenas não têm consultoria regulatória e operam sem saber se estão em conformidade.

**O que o EstetikComply faz:**

- **Score de Compliance Anvisa (0-100)** — Avaliação em tempo real com 9 critérios ponderados: alvará de funcionamento, licença sanitária, responsável técnico com CRM/CRBM ativo, equipamentos com registro Anvisa, POPs atualizados por procedimento, treinamentos de biossegurança, conformidade LGPD, gestão de resíduos (PGRSS) e infraestrutura conforme NT 02/2024
- **Gerador de POP com IA** — Seleciona o tipo de procedimento (invasivo, não-invasivo, laser, micropigmentação, etc) e a IA gera um Procedimento Operacional Padrão completo, com referências legais, usando Vektus Skills Engine L3 e busca semântica nas normas Anvisa
- **Monitor de Legislação Sanitária** — Scrapers automáticos do Diário Oficial da União e portal da Anvisa detectam novas RDCs, NTs e regulamentos, ingerem no Vektus e notificam a clínica com análise de impacto personalizada
- **Alertas de Vencimento** — Alvarás, licenças sanitárias, registros de equipamento, treinamentos — tudo com alertas configuráveis (30, 15, 7 e 1 dia antes) via push, email e in-app
- **Dossiê de Auditoria** — PDF profissional compilado automaticamente com score histórico, todos os documentos vigentes, checklists preenchidos, eventos de compliance e análises de impacto. Pronto para apresentar ao fiscal da vigilância sanitária
- **Checklists Dinâmicos** — Gerados automaticamente por tipo de procedimento com base nas normas vigentes. Preenchimento em campo via app mobile com suporte offline
- **App Mobile** — Checklists em campo com offline-first, câmera para upload rápido de documentos, push notifications e visualização rápida do score

<br/>

### 🏗️ ObraMaster — Compliance de Obras para Pequenos Construtores

A construção civil movimenta R$490 bilhões por ano, mas as soluções de gestão existentes (Sienge, SAP) são voltadas para grandes construtoras. O pequeno construtor que toca 3 a 5 obras simultâneas usa WhatsApp e planilha. As fiscalizações do Ministério do Trabalho por descumprimento de NRs, falta de alvará e ausência de ART resultam em multas pesadas e embargo de obra.

**O que o ObraMaster faz:**

- **Score de Compliance de Obra (0-100)** — 8 critérios: alvará de construção vigente, ART/RRT registrado no CREA/CAU, conformidade NR-18 (segurança no canteiro), licença ambiental, rastreabilidade de materiais por nota fiscal, diário de obra atualizado, seguros obrigatórios e adequação à NR-35 (trabalho em altura)
- **OCR de Notas Fiscais com Rastreabilidade** — O construtor fotografa a nota fiscal de material no celular. O Vektus extrai automaticamente fornecedor, itens, valores e lote. Cada material fica rastreável até a nota de origem — essencial para PROCON e auditorias
- **Compliance por Fase da Obra** — Checklists específicos para cada etapa (fundação, estrutura, alvenaria, instalações, acabamento) com os requisitos regulatórios de cada fase. Evidência fotográfica geolocalizada vinculada a cada etapa
- **Registro Fotográfico como Evidência** — Fotos com GPS automático, timestamp e vinculação à etapa da obra. Servem como prova documental de conformidade em caso de fiscalização
- **Relatório para o Proprietário** — Relatório automático que inclui não apenas o financeiro (orçamento vs gasto), mas o status de compliance da obra. O proprietário sabe se a obra está regular
- **Alertas de NRs e Documentação** — Vencimento de alvará, ART, seguros, licenças ambientais e treinamentos de segurança com antecedência configurável
- **App Mobile** — Registro de fotos em campo, upload de notas fiscais via câmera, preenchimento de checklists de segurança

<br/>

### 📊 TributoSim — Compliance Tributário para Escritórios Contábeis

Com a Reforma Tributária (LC 214/2025), 101 mil escritórios contábeis brasileiros vão operar dois sistemas tributários simultaneamente até 2033. CBS e IBS substituirão PIS, COFINS, ICMS e ISS de forma gradual. Nenhum simulador existente oferece compliance com audit trail de decisões — que é o que protege o contador profissionalmente quando o cliente questiona uma orientação fiscal.

**O que o TributoSim faz:**

- **Simulador CBS/IBS/IS com Motor Rust/WASM** — Cálculo de alta performance compilado em WebAssembly. Projeções ano a ano de 2026 a 2033 com alíquotas progressivas, reduções por NCM/NBS conforme Art. 135 da LC 214/2025. Alíquotas de referência: CBS 8,80% e IBS 17,70% para 2033
- **Score de Compliance Tributário (0-100)** — 8 critérios: SPED entregue sem pendências, regime tributário otimizado com fundamentação, simulação de impacto da Reforma atualizada, obrigações acessórias em dia, documentação de decisões fiscais rastreável, alertas de mudança legislativa atendidos, DIMOB/EFD em conformidade, planejamento tributário com evidência
- **Importação SPED Automática** — Parser Rust/WASM para formato posicional EFD e EFD-Contribuições. Upload do arquivo, extração automática de operações e visualização comparativa do impacto tributário
- **Audit Trail de Decisões Fiscais** — Cada orientação fiscal dada ao cliente é registrada com fundamentação legal, data, simulação associada e assinatura do contador. Em caso de questionamento judicial, o dossiê comprova que o contador agiu com diligência — proteção profissional real
- **Knowledge Base Legislativa** — Toda a LC 214/2025, artigos, notas técnicas, regulamentos CBS/IBS/IS indexados no Vektus. Busca semântica para fundamentação legal de simulações. Skills Engine L3 para interpretação normativa assistida por IA
- **Monitor de Legislação Tributária** — Novos regulamentos, resoluções e instruções normativas detectados automaticamente, ingeridos no Vektus e com análise de impacto nos clientes do escritório
- **Relatório Executivo** — PDF visual com gráficos comparativos (regime atual vs CBS/IBS), projeções 2026-2033 e fundamentação legal. Pronto para o contador apresentar ao cliente

<br/>

### 🔬 LaudoAI — Compliance Laboratorial com Inteligência Artificial

Existem mais de 20 mil laboratórios de análises clínicas no Brasil. Os grandes usam sistemas robustos como InfoLAB e Shift. Os pequenos digitam laudos manualmente, sem rastreabilidade de quem digitou, quem revisou e quem liberou. Quando a vigilância sanitária faz auditoria, não existe evidência do processo. A RDC 657/2022 da Anvisa exige que software usado em saúde atenda a requisitos específicos de rastreabilidade.

**O que o LaudoAI faz:**

- **Revisão de Laudos com IA** — Após o técnico inserir os resultados, a IA (via Vektus Skills Engine L3 com contexto clínico) revisa o laudo antes da liberação: detecta valores críticos, inconsistências entre exames, erros de digitação e sugere observações clínicas baseadas em guidelines SBPC/ML e SBAC
- **Score de Compliance Laboratorial (0-100)** — 6 critérios: laudos liberados por bioquímico habilitado, valores críticos notificados em tempo, rastreabilidade completa de cada laudo, equipamentos calibrados e registrados, conformidade RDC 657/2022, tempo médio de liberação dentro do SLA
- **Event Sourcing Reforçado** — Cada campo do laudo é rastreável individualmente. Quem digitou o resultado de hemoglobina, quando, qual era o valor anterior, quem revisou, quem liberou. Timeline completa e imutável para auditoria da vigilância sanitária
- **Integração HL7 FHIR R4 + ASTM E1381** — Conexão direta com equipamentos de análise. Resultados capturados automaticamente, sem digitação manual, eliminando erros de transcrição
- **Portal do Paciente** — Link único para o paciente acessar seu laudo com linguagem simplificada (inspirado no projeto GAL do HC/USP). Inclui audit trail simplificado mostrando quem processou o exame
- **Knowledge Base Médica** — Protocolos laboratoriais, tabelas de valores de referência por faixa etária e sexo, guidelines SBPC/ML indexados no Vektus para alimentar a revisão por IA
- **Dossiê para Vigilância Sanitária** — Relatório automático com métricas de qualidade, rastreabilidade de laudos, calibrações de equipamentos e evidência de conformidade com RDC 657/2022

<br/>

### 🚛 FrotaLeve — Compliance de Frota para Transportadores Autônomos

700 mil transportadores estão registrados no Brasil, a maioria autônomos ou micro transportadoras. Eles precisam controlar diesel, pedágio, manutenção, CIOT e documentação — mas as soluções existentes (Bsoft TMS, Transportadora Pro) são enterprise, complexas e caras. O autônomo gerencia tudo no caderninho e WhatsApp. Uma multa da ANTT por documentação irregular pode consumir o lucro de vários fretes.

**O que o FrotaLeve faz:**

- **Score de Compliance de Frota (0-100)** — 6 critérios: CNH/MOPP válidos, CRLV e licenciamento em dia, seguro obrigatório RCTR-C, CIOT emitido corretamente, manutenção preventiva em dia, horas de descanso conforme lei
- **OCR de Cupom de Combustível** — O motorista fotografa o cupom do posto. O Vektus extrai automaticamente litros, valor por litro, total, nome do posto e data. Dashboard calcula média de consumo km/l automaticamente
- **Controle da Lei do Descanso** — Tracking GPS com monitoramento de horas de condução. Alertas quando o motorista se aproxima do limite legal. Registro automático de paradas para evidência de conformidade
- **Manutenção Preventiva Regulatória** — Não apenas controle operacional, mas compliance: manutenção preventiva como requisito regulatório da ANTT. Alertas por km rodado e por data, com checklist pré-viagem obrigatório
- **Gestão de Documentação** — CNH, MOPP, CRLV, seguro RCTR-C, licenciamento, vistoria — todos com data de validade, alertas de vencimento e upload via câmera do celular
- **Dashboard de Custos com Compliance** — Custo por km, por viagem, por veículo — integrado com o status de conformidade. O gestor sabe quanto custa operar E se está regular
- **App Mobile-First** — Projetado para o motorista: registro de abastecimento com câmera, checklist pré-viagem, tracking de horas, alertas de documentação. Offline-first para áreas sem sinal

<br/>

### 🏘️ LotePro — Compliance Imobiliário para Pequenos Loteadores

O mercado de lotes explodiu no Brasil. Pequenos loteadores vendem via corretores informais com contratos no Word e controle de inadimplência em planilhas. Existem soluções como Lote Mobile e SIVI, mas nenhuma foca em compliance imobiliário: conformidade com a Lei de Loteamentos (6.766/79), DIMOB para Receita Federal, EFD, escrituração em cartório e LGPD nos dados dos compradores.

**O que o LotePro faz:**

- **Score de Compliance Imobiliário (0-100)** — 7 critérios: registro do loteamento aprovado na prefeitura, matrícula dos lotes no cartório, DIMOB entregue à Receita Federal, contratos conforme Lei 6.766/79, conformidade LGPD nos dados dos compradores, EFD em dia, inadimplência controlada
- **Mapa Interativo de Lotes** — Mapbox GL JS com GeoJSON da planta do loteamento. Lotes coloridos por status (disponível, reservado, vendido) com compliance badges. Click no lote abre detalhe com histórico completo
- **Simulador de Financiamento** — Cálculo Price e SAC com reajuste IGPM/IPCA, CET (Custo Efetivo Total) e tabela completa de parcelas. Link compartilhável via WhatsApp para o corretor enviar ao cliente
- **Geração de Contratos com Fundamentação Legal** — Templates de contrato alimentados pelo Vektus com cláusulas extraídas da knowledge base de legislação imobiliária. Preenchimento automático com dados do lote e comprador. Envio para assinatura eletrônica via Clicksign
- **Boletos com Baixa Automática** — Integração Asaas para emissão de boletos, Pix e cartão. Webhooks de pagamento com baixa automática de parcelas. Conciliação bancária integrada
- **Régua de Cobrança Automatizada** — Parcela venceu: D+1 WhatsApp, D+5 email, D+15 SMS, D+30 notificação formal. Configurável por loteamento. Histórico completo de cobranças no audit trail
- **Portal do Comprador** — Login com CPF, lista de lotes adquiridos, parcelas com status, 2ª via de boleto, histórico de pagamentos e documentos do contrato
- **LGPD Compliance** — Consentimento explícito do comprador para tratamento de dados, registro de finalidade, controle de acesso por role (loteador, corretor, comprador)

---

<h2 id="compliancecore-sdk">ComplianceCore SDK</h2>

O SDK é o coração da plataforma — um conjunto de 8 módulos NestJS que encapsula tudo que é comum a compliance em qualquer setor. Cada vertical instala `@compliancecore/sdk` como dependência e herda o motor completo.

| Módulo | Descrição |
|--------|-----------|
| **EventStore** | Audit trail imutável com Event Sourcing. PostgreSQL, ULID, rebuild com reducer, snapshots. Cada ação é rastreável: quem, quando, o quê, de onde. |
| **ScoreEngine** | Motor genérico de conformidade 0-100. Critérios ponderados por vertical. Trend histórico (melhorando/estável/piorando). Breakdown por critério com evidências. |
| **AlertEngine** | Vencimentos e prazos com alertas multi-canal (push, email, in-app). Dias de antecedência configuráveis. Lifecycle PENDING→SENT→ACKNOWLEDGED. |
| **LegislationMonitor** | Scrapers automatizados de fontes oficiais (Anvisa, DOU, ANTT, Receita Federal). Auto-ingest no Vektus. Análise de impacto por IA. |
| **EvidenceGenerator** | Dossiê de auditoria em PDF via PDFKit. Score histórico, inventário de documentos, timeline de eventos, checklists. Pronto para fiscalização. |
| **DocumentManager** | Upload com categorização, validade, versionamento automático. Indexação semântica no Vektus. Controle de expiração integrado com AlertEngine. |
| **ChecklistEngine** | Checklists dinâmicos gerados via Vektus RAG por tipo de atividade. Avaliação com scoring ponderado (conforme/parcial/não-conforme). |
| **VektusAdapter** | Interface unificada para Vektus: busca semântica, ingestão, OCR, Skills Engine L1/L2/L3. Auth via API key. Webhook com HMAC-SHA256. |

---

<h2 id="arquitetura">Arquitetura</h2>

```
┌─────────────────────────────────────────────────────────────────┐
│                      VERTICAIS SETORIAIS                        │
│                                                                 │
│   EstetikComply    ObraMaster    TributoSim                     │
│   (Estética)       (Construção)  (Tributário)                   │
│                                                                 │
│   LaudoAI          FrotaLeve     LotePro                        │
│   (Laboratórios)   (Transporte)  (Loteamentos)                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    @compliancecore/sdk                           │
│                                                                 │
│   EventStore · ScoreEngine · AlertEngine                        │
│   LegislationMonitor · EvidenceGenerator                        │
│   DocumentManager · ChecklistEngine · VektusAdapter             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    @compliancecore/ui                            │
│                                                                 │
│   ScoreGauge · AuditTimeline · AlertBanner · ChecklistForm      │
│   DocumentUploader · ComplianceBadge · DossierPreview           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    VEKTUS (RAG/OCR Service)                     │
│                                                                 │
│   Ingest · Search · Skills L1/L2/L3 · OCR · pgvector           │
│   Tesseract + Vision AI · Chunking · Embeddings                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    INFRAESTRUTURA                               │
│                                                                 │
│   PostgreSQL 16 + pgvector · Redis 7 · BullMQ                  │
│   Cloudflare R2 · Clerk Auth · OpenTelemetry                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo de Compliance Universal

```
1. Onboarding           Cadastro da entidade regulada
         ↓
2. Regulação            Legislação do setor indexada no Vektus
         ↓
3. Checklist            Gerado automaticamente por tipo de atividade
         ↓
4. Documentos           Upload com validade, versionamento, indexação
         ↓
5. Score                Conformidade calculada em tempo real (0-100)
         ↓
6. Alertas              Vencimentos notificados com antecedência
         ↓
7. Monitoramento        Novas normas detectadas com análise de impacto
         ↓
8. Dossiê               Evidência compilada, pronta para auditoria
```

---

<h2 id="features-compartilhadas">Features Compartilhadas</h2>

| Feature | Descrição |
|---------|-----------|
| 🛡️ **Audit Trail Imutável** | Event Sourcing com PostgreSQL. Cada ação registrada com ator, timestamp, IP, correlation ID. Rebuild de estado por replay. |
| 📊 **Score de Compliance** | Motor genérico 0-100 com critérios ponderados por vertical. 4 níveis. Trend histórico. Breakdown com evidências. |
| 🔔 **Alertas Inteligentes** | Vencimentos com antecedência configurável. Multi-canal: push, email, in-app. Lifecycle com acknowledge. |
| 📋 **Checklists Dinâmicos** | Gerados por IA via Vektus RAG. Scoring ponderado. Offline em campo. |
| 📄 **Dossiê de Auditoria** | PDF com score histórico, documentos, eventos, checklists e análises de impacto. |
| 📜 **Monitor de Legislação** | Scraping automático de fontes oficiais. Auto-ingest no Vektus. Análise de impacto por IA. |
| 📎 **Gestão Documental** | Upload, categorização, validade, versionamento, indexação semântica. |
| 🔐 **Auth Multi-tenant** | Clerk com RBAC por vertical e por entidade. |
| 🔍 **Busca Semântica** | Vektus com pgvector para consultas em legislação e documentos. |
| 🤖 **IA Contextual** | Skills Engine L1/L2/L3 para POPs, revisão de laudos, análise de impacto. |
| 📈 **Observabilidade** | OpenTelemetry, métricas Prometheus, logs estruturados Pino. |
| 📱 **Mobile-First** | Expo com offline-first, câmera, push notifications. |

---

<h2 id="vektus-integration">Integração com Vektus</h2>

O [Vektus](https://github.com/orbitmind/vektus) é a plataforma RAG/OCR que serve como cérebro regulatório do ComplianceCore:

- **Extração multimodal** — PDF, DOCX, XLSX, PPTX, CSV, imagens
- **OCR** — Tesseract.js (PT-BR + EN) com fallback Vision AI (Gemini)
- **Chunking recursivo** — 800 tokens / 100 overlap
- **Embeddings** — OpenAI text-embedding-3-small
- **Busca vetorial** — pgvector HNSW, similaridade coseno
- **Skills Engine** — L1 (básico), L2 (intermediário), L3 (especialista)

```typescript
// Adapter pattern — todas as verticais consomem via mesma interface
const normas = await vektusAdapter.search(
  'requisitos biossegurança procedimento invasivo Anvisa',
  PROJECT_ID
);
```

---

<h2 id="quick-start">Quick Start</h2>

```bash
git clone git@github.com:orbitmind/compliancecore.git
cd compliancecore
pnpm install
docker compose up -d          # PostgreSQL + pgvector + Redis
pnpm db:migrate               # Event Store + domain tables
cp .env.example .env          # Configure Clerk, Vektus, R2
pnpm dev                      # Turborepo — todas as apps
```

| Vertical | API | Web |
|----------|-----|-----|
| EstetikComply | `3001` | `3100` |
| ObraMaster | `3002` | `3102` |
| TributoSim | `3003` | `3103` |
| LaudoAI | `3004` | `3104` |
| FrotaLeve | `3005` | `3105` |
| LotePro | `3006` | `3106` |

```bash
pnpm dev              # Dev mode (Turborepo)
pnpm build            # Production build
pnpm test             # Vitest
pnpm test:coverage    # Coverage report
pnpm lint             # ESLint
pnpm db:migrate       # Run migrations
pnpm db:reset         # Reset + re-migrate
```

---

<h2 id="stack-tecnológica">Stack Tecnológica</h2>

| Camada | Tecnologia |
|--------|-----------|
| SDK | `@compliancecore/sdk` — NestJS 11, TypeScript Strict, 8 módulos |
| UI Kit | `@compliancecore/ui` — 7 componentes React |
| Types | `@compliancecore/shared` — Zod schemas, TypeScript interfaces |
| Backend | NestJS 11 + class-validator + class-transformer |
| Frontend Web | Next.js 15 App Router + Tailwind + shadcn/ui + TanStack Query v5 |
| Frontend Mobile | React Native + Expo SDK 52 + NativeWind |
| Database | PostgreSQL 16 + pgvector + Event Store |
| Cache | Redis 7 (Upstash) |
| Queue | BullMQ |
| RAG/OCR | Vektus |
| Storage | Cloudflare R2 |
| Auth | Clerk (multi-tenant + RBAC) |
| Pagamentos | Asaas — LotePro |
| Assinatura | Clicksign — LotePro |
| Cálculo | Rust → WASM — TributoSim |
| Lab Integration | HL7 FHIR R4 + ASTM — LaudoAI |
| Observabilidade | OpenTelemetry + Grafana Cloud |
| CI/CD | GitHub Actions + Docker + GHCR |
| Monorepo | Turborepo + pnpm workspaces |
| Testes | Vitest + Playwright + Testcontainers |

---

## Estrutura do Monorepo

```
compliancecore/
├── packages/
│   ├── sdk/                        @compliancecore/sdk
│   │   └── src/
│   │       ├── event-store/             Audit trail imutável
│   │       ├── score-engine/            Motor de conformidade
│   │       ├── alerts/                  Vencimentos multi-canal
│   │       ├── legislation/             Monitor regulatório
│   │       ├── evidence/               Gerador de dossiê PDF
│   │       ├── documents/              Gestão documental
│   │       ├── checklists/             Checklists via RAG
│   │       ├── vektus/                 Adapter RAG/OCR
│   │       └── auth/                   Clerk + RBAC + webhook guard
│   ├── ui/                         @compliancecore/ui
│   │   └── src/
│   │       ├── ScoreGauge/              Gauge SVG animado
│   │       ├── AuditTimeline/           Timeline com a11y
│   │       ├── AlertBanner/             Alertas priorizados
│   │       ├── ChecklistForm/           Form dinâmico
│   │       ├── DocumentUploader/        Drag & drop
│   │       ├── ComplianceBadge/         Badge de status
│   │       └── DossierPreview/          Preview PDF
│   └── shared/                     @compliancecore/shared
├── apps/
│   ├── estetik-api/                Compliance Estética
│   ├── estetik-web/                Dashboard EstetikComply
│   ├── estetik-mobile/             App de campo
│   ├── obra-api/                   Compliance Construção
│   ├── obra-web/                   Dashboard ObraMaster
│   ├── obra-mobile/                App de canteiro
│   ├── tributo-api/                Compliance Tributário
│   ├── tributo-web/                Simulador TributoSim
│   ├── laudo-api/                  Compliance Laboratorial
│   ├── laudo-web/                  Central LaudoAI
│   ├── frota-api/                  Compliance de Frota
│   ├── frota-web/                  Dashboard FrotaLeve
│   ├── frota-mobile/               App do motorista
│   ├── lote-api/                   Compliance Imobiliário
│   ├── lote-web/                   Plataforma LotePro
│   └── lote-mobile/                App do corretor
└── infra/
    ├── docker-compose.yml          PostgreSQL + pgvector + Redis
    └── migrations/                 Event Store + domain tables
```

---

<h2 id="roadmap">Roadmap</h2>

| Fase | Período | Entrega | Status |
|------|---------|---------|--------|
| **Fase 0** | Sem 1–4 | ComplianceCore SDK + UI Kit + Shared Types + Infra | ✅ Completo |
| **Fase 1** | Sem 5–10 | EstetikComply MVP | 🔄 Em progresso |
| **Fase 2** | Sem 11–16 | ObraMaster + TributoSim | ⏳ Planejado |
| **Fase 3** | Sem 17–22 | LaudoAI + FrotaLeve | ⏳ Planejado |
| **Fase 4** | Sem 23–28 | LotePro + Apps mobile | ⏳ Planejado |
| **Fase 5** | Sem 29+ | Analytics, multi-idioma, marketplace | ⏳ Futuro |

---

## Variáveis de Ambiente

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=compliancecore
DB_USER=postgres
DB_PASSWORD=

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Vektus (RAG/OCR)
VEKTUS_BASE_URL=https://vektus.adalink.com
VEKTUS_API_KEY=vkt_...
VEKTUS_WEBHOOK_SECRET=
VEKTUS_PROJECT_ID=

# Auth (Clerk)
CLERK_SECRET_KEY=sk_...
CLERK_PUBLISHABLE_KEY=pk_...

# Storage (Cloudflare R2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=compliancecore-docs

# App
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3100
LOG_LEVEL=info
```

---

## Contribuindo

Projeto privado da [Orbitmind](https://github.com/orbitmind).

1. Branch a partir de `main`: `feat/`, `fix/`, `docs/`
2. [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
3. `pnpm build` e `pnpm test` devem passar
4. PR com review e CI verde

---

## Licença

Proprietário · © 2026 [Orbitmind](https://github.com/orbitmind) · Todos os direitos reservados

---

<p align="center">
  <sub>Construído por <a href="https://github.com/orbitmind">Orbitmind</a> · Powered by <a href="https://github.com/orbitmind/vektus">Vektus RAG/OCR</a></sub>
</p>
