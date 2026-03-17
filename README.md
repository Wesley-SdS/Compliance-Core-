<p align="center">
  <img src=".github/assets/logo.svg" alt="ComplianceCore" width="80" height="80" />
</p>

<h1 align="center">ComplianceCore</h1>

<p align="center">
  <strong>Plataforma de Compliance & Governança para o Brasil</strong>
</p>

<p align="center">
  6 verticais setoriais · 1 SDK compartilhado · Powered by Vektus RAG/OCR
</p>

<p align="center">
  <a href="#verticais">Verticais</a> ·
  <a href="#arquitetura">Arquitetura</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#sdk">SDK</a> ·
  <a href="#stack">Stack</a> ·
  <a href="#roadmap">Roadmap</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React_Native-Expo_52-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/License-Proprietary-333?style=flat-square" />
</p>

---

## O Problema

Compliance no Brasil é um labirinto. Regulações de Anvisa, ANTT, Receita Federal, CREAs, CRMs e vigilâncias sanitárias mudam constantemente. Pequenos negócios — clínicas, construtoras, transportadores, laboratórios, escritórios contábeis, loteadores — operam sem consultoria regulatória, usando planilhas e WhatsApp. O resultado: multas, interdições e exposição jurídica.

## A Solução

ComplianceCore transforma compliance de reativo em proativo. Um motor de conformidade que **conhece** a regulação, **monitora** mudanças, **verifica** conformidade automaticamente, **mantém** evidência rastreável e **gera** dossiês de auditoria — para 6 setores da economia brasileira.

---

<h2 id="verticais">Verticais</h2>

<table>
<tr>
<td width="33%" valign="top">

### 🏥 EstetikComply
**Clínicas de Estética**

Score de compliance Anvisa, alertas de vencimento de licenças, geração de POPs com IA, monitor de legislação sanitária, dossiê para fiscalização.

`R$149–599/mês`

</td>
<td width="33%" valign="top">

### 🏗️ ObraMaster
**Pequenos Construtores**

Compliance de NRs, alvará, ART/RRT, licença ambiental. OCR de notas fiscais com rastreabilidade de material. Registro fotográfico como evidência.

`R$199–799/mês`

</td>
<td width="33%" valign="top">

### 📊 TributoSim
**Escritórios Contábeis**

Simulador da Reforma Tributária (CBS/IBS/IS) com motor Rust/WASM. Audit trail de decisões fiscais. Proteção profissional do contador.

`R$99–599/mês`

</td>
</tr>
<tr>
<td width="33%" valign="top">

### 🔬 LaudoAI
**Laboratórios de Análises**

Revisão de laudos com IA, rastreabilidade total (Event Sourcing), conformidade RDC 657/2022, integração HL7/ASTM, portal do paciente.

`R$199–999/mês`

</td>
<td width="33%" valign="top">

### 🚛 FrotaLeve
**Transportadores Autônomos**

Compliance ANTT, controle de CIOT, lei do descanso, OCR de cupom de combustível, manutenção preventiva regulatória, alertas de documentação.

`R$49–399/mês`

</td>
<td width="33%" valign="top">

### 🏘️ LotePro
**Pequenos Loteadores**

Compliance Lei 6.766/79, DIMOB, LGPD. Simulador Price/SAC, contratos com assinatura eletrônica, boletos com baixa automática, portal do comprador.

`R$199–799/mês`

</td>
</tr>
</table>

---

<h2 id="arquitetura">Arquitetura</h2>

```
┌─────────────────────────────────────────────────────────────┐
│                    VERTICAIS SETORIAIS                       │
│  EstetikComply · ObraMaster · TributoSim                    │
│  LaudoAI · FrotaLeve · LotePro                              │
├─────────────────────────────────────────────────────────────┤
│                  @compliancecore/sdk                         │
│  EventStore · ScoreEngine · AlertEngine                     │
│  LegislationMonitor · EvidenceGenerator                     │
│  DocumentManager · ChecklistEngine                          │
├─────────────────────────────────────────────────────────────┤
│                  VEKTUS (RAG/OCR)                            │
│  Ingest · Search · Skills L1/L2/L3 · OCR · pgvector        │
├─────────────────────────────────────────────────────────────┤
│                  INFRAESTRUTURA                              │
│  PostgreSQL 16 · Redis 7 · BullMQ · R2 · Clerk · OTel      │
└─────────────────────────────────────────────────────────────┘
```

O SDK resolve **70%** de cada vertical. Cada produto adiciona apenas lógica de domínio específica — critérios de score, scrapers regulatórios e regras de negócio do setor.

---

<h2 id="sdk">ComplianceCore SDK</h2>

O coração da plataforma. 8 módulos NestJS reutilizáveis por todas as verticais:

| Módulo | O que faz |
|--------|-----------|
| **EventStore** | Audit trail imutável com Event Sourcing. PostgreSQL, ULID, rebuild com reducer, snapshots. Cada ação é rastreável: quem fez, quando, o quê. |
| **ScoreEngine** | Motor genérico de conformidade 0–100. Cada vertical registra critérios com pesos. Trend histórico (melhorando/estável/piorando). |
| **AlertEngine** | Vencimentos e prazos com alertas multi-canal (push, email, in-app). Dias de antecedência configuráveis. Lifecycle PENDING→SENT→ACKNOWLEDGED. |
| **LegislationMonitor** | Scrapers de fontes regulatórias (Anvisa, DOU, ANTT, Receita Federal). Auto-ingest no Vektus. Análise de impacto com IA. |
| **EvidenceGenerator** | Dossiê de auditoria em PDF. Score histórico, documentos, eventos, checklists — tudo compilado e pronto para apresentar ao fiscal. |
| **DocumentManager** | Upload com versionamento, categorização, validade. Indexação automática no Vektus. Controle de expiração. |
| **ChecklistEngine** | Checklists dinâmicos gerados via Vektus RAG por tipo de atividade. Avaliação com scoring ponderado. |
| **VektusAdapter** | Interface unificada para o Vektus: busca semântica, ingestão de documentos, OCR, Skills Engine L1/L2/L3. |

---

## Features Compartilhadas

Todas as 6 verticais herdam do SDK:

- 🛡️ **Audit Trail Imutável** — Event Sourcing com PostgreSQL. Cada ação registrada com ator, timestamp, IP e correlation ID
- 📊 **Score de Compliance 0–100** — Atualização em tempo real, breakdown por critério, trend histórico
- 🔔 **Alertas Inteligentes** — Vencimentos com antecedência configurável, multi-canal (push/email/in-app)
- 📋 **Checklists Dinâmicos** — Gerados por IA com base na regulação vigente via Vektus RAG
- 📄 **Dossiê de Auditoria** — PDF profissional com toda evidência de conformidade, pronto para fiscalização
- 📜 **Monitor de Legislação** — Scraping automático de fontes oficiais, análise de impacto com IA
- 📎 **Gestão Documental** — Upload, versionamento, validade, indexação semântica
- 🔐 **Auth Multi-tenant** — Clerk com RBAC por vertical e por entidade
- 🔍 **Busca Semântica** — Vektus com pgvector para consultas em legislação e documentos
- 📈 **Observabilidade** — OpenTelemetry com traces distribuídos, métricas Prometheus, logs estruturados

---

<h2 id="quick-start">Quick Start</h2>

### Pré-requisitos

- Node.js 20 LTS
- pnpm 9+
- Docker & Docker Compose

### Setup

```bash
# Clone
git clone git@github.com:orbitmind/compliancecore.git
cd compliancecore

# Instale dependências
pnpm install

# Suba PostgreSQL + Redis
docker compose up -d

# Rode migrations
pnpm db:migrate

# Configure variáveis
cp .env.example .env
# Edite .env com suas credenciais (Clerk, Vektus, R2)

# Rode tudo (Turborepo)
pnpm dev
```

### Portas

| Vertical | API | Web |
|----------|-----|-----|
| EstetikComply | `3001` | `3100` |
| ObraMaster | `3002` | `3102` |
| TributoSim | `3003` | `3103` |
| LaudoAI | `3004` | `3104` |
| FrotaLeve | `3005` | `3105` |
| LotePro | `3006` | `3106` |

---

<h2 id="stack">Stack</h2>

| Camada | Tecnologia |
|--------|-----------|
| **SDK** | `@compliancecore/sdk` — NestJS 11 modules, TypeScript Strict |
| **UI Kit** | `@compliancecore/ui` — React components (ScoreGauge, AuditTimeline, AlertBanner, etc) |
| **Types** | `@compliancecore/shared` — Zod schemas, TypeScript types |
| **Backend** | NestJS 11 + TypeScript Strict + class-validator |
| **Frontend Web** | Next.js 15 App Router + Tailwind CSS + shadcn/ui |
| **Frontend Mobile** | React Native + Expo SDK 52 + NativeWind |
| **Database** | PostgreSQL 16 + pgvector + Event Store |
| **Cache** | Redis 7 (Upstash) |
| **Queue** | BullMQ |
| **RAG/OCR** | Vektus API (busca semântica, ingestão, Skills Engine, OCR) |
| **Storage** | Cloudflare R2 |
| **Auth** | Clerk (multi-tenant + RBAC) |
| **Pagamentos** | Asaas (boletos, Pix) — LotePro |
| **Assinatura** | Clicksign (contratos eletrônicos) — LotePro |
| **Cálculo Tributário** | Rust → WebAssembly — TributoSim |
| **Integração Lab** | HL7 FHIR R4 + ASTM E1381 — LaudoAI |
| **Observabilidade** | OpenTelemetry + Grafana Cloud |
| **CI/CD** | GitHub Actions + Docker + GHCR |
| **Monorepo** | Turborepo + pnpm workspaces |
| **Testes** | Vitest + Playwright + Testcontainers |

---

## Estrutura do Monorepo

```
compliancecore/
├── packages/
│   ├── sdk/                 @compliancecore/sdk
│   │   └── src/
│   │       ├── event-store/      Audit trail imutável
│   │       ├── score-engine/     Motor de conformidade
│   │       ├── alerts/           Vencimentos e prazos
│   │       ├── legislation/      Monitor regulatório
│   │       ├── evidence/         Dossiê de auditoria
│   │       ├── documents/        Gestão documental
│   │       ├── checklists/       Checklists dinâmicos
│   │       ├── vektus/           RAG/OCR adapter
│   │       └── auth/             Clerk guard + RBAC
│   ├── ui/                  @compliancecore/ui
│   │   └── src/
│   │       ├── ScoreGauge/       Gauge circular 0-100
│   │       ├── AuditTimeline/    Timeline de eventos
│   │       ├── AlertBanner/      Alertas urgentes
│   │       ├── ChecklistForm/    Formulário dinâmico
│   │       ├── DocumentUploader/ Upload com drag & drop
│   │       ├── ComplianceBadge/  Badge de status
│   │       └── DossierPreview/   Preview de dossiê
│   └── shared/              @compliancecore/shared
│       └── src/
│           ├── types/            TypeScript interfaces
│           └── schemas/          Zod validation
├── apps/
│   ├── estetik-api/         NestJS — Clínicas de Estética
│   ├── estetik-web/         Next.js — Dashboard EstetikComply
│   ├── estetik-mobile/      Expo — App de campo
│   ├── obra-api/            NestJS — Construção Civil
│   ├── obra-web/            Next.js — Dashboard ObraMaster
│   ├── tributo-api/         NestJS — Tributário
│   ├── tributo-web/         Next.js — Simulador TributoSim
│   ├── laudo-api/           NestJS — Laboratórios
│   ├── laudo-web/           Next.js — Central LaudoAI
│   ├── frota-api/           NestJS — Transportadores
│   ├── frota-web/           Next.js — Dashboard FrotaLeve
│   ├── lote-api/            NestJS — Loteamentos
│   └── lote-web/            Next.js — Plataforma LotePro
├── infra/
│   ├── docker-compose.yml   PostgreSQL + pgvector + Redis
│   └── migrations/          SQL migrations
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

---

## Fluxo de Compliance Universal

Todas as verticais seguem o mesmo ciclo, com regulações e entidades específicas de cada setor:

```
Onboarding → Indexação de Regulação → Checklist Dinâmico
     ↓              ↓                        ↓
  Documentos → Score de Compliance → Alertas de Vencimento
     ↓              ↓                        ↓
  Monitoramento → Análise de Impacto → Dossiê de Auditoria
```

1. **Cadastro** da entidade (clínica, obra, empresa, lab, veículo, loteamento)
2. **Regulação** indexada no Vektus (RDCs, NRs, LCs, leis setoriais)
3. **Checklist** gerado automaticamente por tipo de atividade
4. **Documentos** uploadados com validade e versionamento
5. **Score** calculado cruzando docs + checklists + critérios do setor
6. **Alertas** de vencimentos enviados com antecedência
7. **Monitoramento** de novas normas com análise de impacto por IA
8. **Dossiê** compilado com toda evidência, pronto para auditoria

---

## Integração com Vektus

O [Vektus](https://github.com/orbitmind/vektus) é a plataforma RAG/OCR que serve como cérebro regulatório do ComplianceCore:

- **Busca Semântica** — Legislação, normas e documentos indexados com pgvector (HNSW)
- **OCR** — Tesseract + Vision AI para notas fiscais, cupons, documentos em papel
- **Skills Engine L1/L2/L3** — Injeção progressiva de contexto especializado por setor
- **Extração Multimodal** — PDF, DOCX, XLSX, PPTX, CSV, imagens

```typescript
// Todas as verticais consomem Vektus via o mesmo adapter
const results = await vektusAdapter.search(
  'requisitos biossegurança procedimento invasivo Anvisa',
  PROJECT_ID
);
```

---

<h2 id="roadmap">Roadmap</h2>

| Fase | Período | Entrega |
|------|---------|---------|
| **Fase 0** | Sem 1–4 | ✅ ComplianceCore SDK + UI Kit + Shared Types |
| **Fase 1** | Sem 5–10 | 🔄 EstetikComply MVP (primeira vertical) |
| **Fase 2** | Sem 11–16 | ObraMaster + TributoSim |
| **Fase 3** | Sem 17–22 | LaudoAI + FrotaLeve |
| **Fase 4** | Sem 23–28 | LotePro + Mobile apps |
| **Fase 5** | Sem 29+ | Analytics avançado, multi-idioma, marketplace de integrações |

---

## Scripts

```bash
pnpm dev              # Roda todas as apps em paralelo (Turborepo)
pnpm build            # Build de produção de tudo
pnpm test             # Roda todos os testes (Vitest)
pnpm test:coverage    # Testes com cobertura
pnpm lint             # ESLint em todo o monorepo
pnpm db:migrate       # Roda SQL migrations
pnpm db:reset         # Reset do banco + migrations
```

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

Este é um projeto privado da Orbitmind. Para contribuir:

1. Crie uma branch a partir de `main`
2. Siga o padrão de commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
3. Garanta que `pnpm build` e `pnpm test` passam
4. Abra um PR com descrição clara

---

## Licença

Proprietário. © 2026 Orbitmind. Todos os direitos reservados.

---

<p align="center">
  <sub>Construído com ❤️ por <a href="https://github.com/orbitmind">Orbitmind</a> · Powered by <a href="https://github.com/orbitmind/vektus">Vektus</a></sub>
</p>
