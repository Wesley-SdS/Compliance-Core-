import { Injectable, Logger } from '@nestjs/common';
import { ulid } from 'ulid';
import {
  VektusAdapterService,
  EventStoreService,
  DatabaseService,
} from '@compliancecore/sdk';

export interface GerarPOPInput {
  procedimentoId: string;
  procedimentoNome: string;
  procedimentoTipo: string;
  contextoAdicional?: string;
  actorId: string;
}

export interface POPSecao {
  titulo: string;
  conteudo: string;
  ordem: number;
}

export interface POPOutput {
  id: string;
  procedimentoId: string;
  titulo: string;
  versao: number;
  conteudo: string;
  secoes: POPSecao[];
  status: 'RASCUNHO' | 'EM_REVISAO' | 'APROVADO' | 'OBSOLETO';
  geradoPorIA: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class GerarPOPUseCase {
  private readonly logger = new Logger(GerarPOPUseCase.name);

  constructor(
    private readonly vektus: VektusAdapterService,
    private readonly eventStore: EventStoreService,
    private readonly db: DatabaseService,
  ) {}

  async execute(input: GerarPOPInput): Promise<POPOutput> {
    const id = ulid();
    const now = new Date();

    // 1. Get latest version number
    const latestRow = await this.db.queryOne<{ data: POPOutput }>(
      `SELECT data FROM pops
       WHERE data->>'procedimentoId' = $1
       ORDER BY (data->>'versao')::int DESC LIMIT 1`,
      [input.procedimentoId],
    );
    const nextVersion = latestRow ? latestRow.data.versao + 1 : 1;

    // 2. Search Vektus for relevant regulatory context
    let regulatoryContext = '';
    try {
      const searchResults = await this.vektus.search(
        `POP procedimento ${input.procedimentoNome} ${input.procedimentoTipo} regulamentacao anvisa`,
        { topK: 5, threshold: 0.5 },
      );
      regulatoryContext = searchResults.map((r) => r.content).join('\n\n');
    } catch (error) {
      this.logger.warn('Vektus search failed, proceeding without regulatory context');
    }

    // 3. Generate POP sections via Vektus AI Skills L3
    let secoes: POPSecao[];
    try {
      const skillsContext = await this.vektus.injectSkills('L3',
        `Gerar POP completo para o procedimento estético "${input.procedimentoNome}" (tipo: ${input.procedimentoTipo}).
         ${input.contextoAdicional ? `Contexto adicional: ${input.contextoAdicional}` : ''}
         ${regulatoryContext ? `Contexto regulatório encontrado:\n${regulatoryContext}` : ''}`,
        { vertical: 'estetik' },
      );

      secoes = this.parseSkillsOutput(skillsContext.context, input);
    } catch (error) {
      this.logger.warn('Vektus AI Skills failed, using template POP');
      secoes = this.generateTemplateSections(input);
    }

    const conteudo = secoes.map((s) => `## ${s.titulo}\n\n${s.conteudo}`).join('\n\n');

    // 4. Persist POP
    const pop: POPOutput = {
      id,
      procedimentoId: input.procedimentoId,
      titulo: `POP - ${input.procedimentoNome}`,
      versao: nextVersion,
      conteudo,
      secoes,
      status: 'RASCUNHO',
      geradoPorIA: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.query(
      `INSERT INTO pops (id, data, created_at, updated_at) VALUES ($1, $2, $3, $4)`,
      [id, JSON.stringify(pop), now, now],
    );

    // 5. Ingest POP into Vektus for future searches
    try {
      await this.vektus.ingest(conteudo, {
        fileName: `pop-${id}.md`,
        vertical: 'estetik',
        category: 'pop',
        tags: ['pop', input.procedimentoTipo, input.procedimentoNome],
      });
    } catch (error) {
      this.logger.warn('Failed to ingest POP into Vektus');
    }

    // 6. Emit event
    await this.eventStore.append(id, 'Pop', 'POP_GENERATED', {
      procedimentoId: input.procedimentoId,
      procedimentoNome: input.procedimentoNome,
      versao: nextVersion,
      geradoPorIA: true,
      usedRegulatoryContext: !!regulatoryContext,
    }, {
      actorId: input.actorId,
      actorRole: 'admin',
      ip: '0.0.0.0',
      correlationId: ulid(),
    });

    this.logger.log(`POP generated via use-case: ${pop.titulo} v${nextVersion}`);
    return pop;
  }

  private parseSkillsOutput(context: string, input: GerarPOPInput): POPSecao[] {
    // Try to parse structured output from AI
    const sections = context.split(/^##\s+/m).filter(Boolean);
    if (sections.length >= 4) {
      return sections.map((section, index) => {
        const lines = section.trim().split('\n');
        const titulo = lines[0].trim();
        const conteudo = lines.slice(1).join('\n').trim();
        return { titulo, conteudo, ordem: index + 1 };
      });
    }
    // Fallback to template if parsing fails
    return this.generateTemplateSections(input);
  }

  private generateTemplateSections(input: GerarPOPInput): POPSecao[] {
    return [
      {
        titulo: 'Objetivo',
        conteudo: `Estabelecer o procedimento operacional padrao para a realizacao de ${input.procedimentoNome} (${input.procedimentoTipo}) em conformidade com as normas da Anvisa e boas praticas clinicas.`,
        ordem: 1,
      },
      {
        titulo: 'Campo de Aplicacao',
        conteudo: `Este POP aplica-se a todos os profissionais habilitados que realizam ${input.procedimentoNome} na clinica, incluindo medicos, enfermeiros e tecnicos autorizados.`,
        ordem: 2,
      },
      {
        titulo: 'Definicoes e Abreviaturas',
        conteudo: `- POP: Procedimento Operacional Padrao\n- TCLE: Termo de Consentimento Livre e Esclarecido\n- EPI: Equipamento de Protecao Individual\n- RT: Responsavel Tecnico`,
        ordem: 3,
      },
      {
        titulo: 'Responsabilidades',
        conteudo: `- Responsavel Tecnico: Aprovacao e supervisao do procedimento\n- Profissional Executor: Realizacao do procedimento conforme este POP\n- Equipe de Apoio: Preparacao do ambiente e materiais\n- Administrativo: Verificacao do TCLE e documentacao`,
        ordem: 4,
      },
      {
        titulo: 'Materiais e Equipamentos',
        conteudo: `Listar todos os materiais e equipamentos necessarios para ${input.procedimentoNome}:\n- Equipamentos com registro Anvisa vigente\n- Materiais descartaveis\n- EPIs necessarios\n- Produtos especificos para o procedimento`,
        ordem: 5,
      },
      {
        titulo: 'Procedimento',
        conteudo: `1. PRE-PROCEDIMENTO:\n   a. Verificar TCLE assinado\n   b. Confirmar anamnese atualizada\n   c. Verificar contraindicacoes\n   d. Preparar ambiente e materiais\n\n2. DURANTE O PROCEDIMENTO:\n   a. Confirmar identidade do paciente\n   b. Aplicar tecnica conforme treinamento\n   c. Monitorar sinais vitais quando aplicavel\n\n3. POS-PROCEDIMENTO:\n   a. Orientar paciente sobre cuidados pos\n   b. Registrar procedimento no prontuario\n   c. Descartar materiais conforme PGRSS`,
        ordem: 6,
      },
      {
        titulo: 'Registro e Documentacao',
        conteudo: `- Registro fotografico (antes e depois) com consentimento\n- Prontuario atualizado\n- Ficha de procedimento preenchida\n- Registro de lote dos produtos utilizados`,
        ordem: 7,
      },
      {
        titulo: 'Referencias Normativas',
        conteudo: `- RDC 56/2009 - Requisitos para clinicas de estetica\n- RDC 36/2008 - Seguranca do paciente\n- RDC 222/2018 - Gerenciamento de residuos\n- Lei 13.709/2018 - LGPD`,
        ordem: 8,
      },
    ];
  }
}
