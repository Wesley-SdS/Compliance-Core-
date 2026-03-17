import { ComplianceCriterion } from '@compliancecore/shared';

export const TRIBUTO_CRITERIA: ComplianceCriterion[] = [
  {
    id: 'sped_em_dia',
    name: 'SPED em Dia',
    weight: 20,
    category: 'Obrigacoes',
    evaluate: (entity) => {
      const spedAtualizado = entity.spedFiles?.some(
        (s: any) => s.status === 'VALIDADO' && s.competencia === entity.competenciaAtual,
      );
      return {
        criterionId: 'sped_em_dia',
        status: spedAtualizado ? 'CONFORME' : 'NAO_CONFORME',
        score: spedAtualizado ? 100 : 0,
        details: spedAtualizado
          ? 'SPED entregue e validado para competencia atual'
          : 'SPED pendente ou nao validado',
      };
    },
  },
  {
    id: 'obrigacoes_acessorias',
    name: 'Obrigacoes Acessorias',
    weight: 15,
    category: 'Obrigacoes',
    evaluate: (entity) => {
      const total = entity.obrigacoes?.length || 0;
      if (total === 0) {
        return {
          criterionId: 'obrigacoes_acessorias',
          status: 'NAO_APLICAVEL',
          score: 100,
          details: 'Sem obrigacoes acessorias cadastradas',
        };
      }
      const cumpridas = entity.obrigacoes?.filter((o: any) => o.status === 'CUMPRIDA').length || 0;
      const pct = (cumpridas / total) * 100;
      return {
        criterionId: 'obrigacoes_acessorias',
        status: pct === 100 ? 'CONFORME' : pct > 50 ? 'PARCIAL' : 'NAO_CONFORME',
        score: pct,
        details: `${cumpridas}/${total} obrigacoes acessorias cumpridas`,
      };
    },
  },
  {
    id: 'certidoes_negativas',
    name: 'Certidoes Negativas',
    weight: 15,
    category: 'Certidoes',
    evaluate: (entity) => {
      const has = entity.documents?.some(
        (d: any) =>
          d.category === 'certidao_negativa' &&
          (!d.expiresAt || new Date(d.expiresAt) > new Date()),
      );
      return {
        criterionId: 'certidoes_negativas',
        status: has ? 'CONFORME' : 'NAO_CONFORME',
        score: has ? 100 : 0,
        details: has
          ? 'Certidoes negativas validas'
          : 'Certidoes negativas ausentes ou vencidas',
      };
    },
  },
  {
    id: 'regime_tributario',
    name: 'Regime Tributario Correto',
    weight: 15,
    category: 'Planejamento',
    evaluate: (entity) => {
      const has = entity.regimeTributario && entity.regimeVerificado;
      return {
        criterionId: 'regime_tributario',
        status: has ? 'CONFORME' : 'NAO_CONFORME',
        score: has ? 100 : 0,
        details: has
          ? `Regime ${entity.regimeTributario} verificado e adequado`
          : 'Regime tributario nao verificado',
      };
    },
  },
  {
    id: 'backup_dados',
    name: 'Backup de Dados',
    weight: 10,
    category: 'Seguranca',
    evaluate: (entity) => {
      const has = entity.backupAtualizado;
      return {
        criterionId: 'backup_dados',
        status: has ? 'CONFORME' : 'NAO_CONFORME',
        score: has ? 100 : 0,
        details: has ? 'Backup de dados atualizado' : 'Backup de dados desatualizado',
      };
    },
  },
  {
    id: 'lgpd_dados_clientes',
    name: 'LGPD Dados Clientes',
    weight: 10,
    category: 'LGPD',
    evaluate: (entity) => {
      const has = entity.lgpdCompliance;
      return {
        criterionId: 'lgpd_dados_clientes',
        status: has ? 'CONFORME' : 'NAO_CONFORME',
        score: has ? 100 : 0,
        details: has ? 'Dados de clientes em conformidade com LGPD' : 'LGPD nao implementada para dados de clientes',
      };
    },
  },
  {
    id: 'procuracao_eletronica',
    name: 'Procuracao Eletronica',
    weight: 10,
    category: 'Documentacao',
    evaluate: (entity) => {
      const has = entity.documents?.some(
        (d: any) =>
          d.category === 'procuracao' &&
          (!d.expiresAt || new Date(d.expiresAt) > new Date()),
      );
      return {
        criterionId: 'procuracao_eletronica',
        status: has ? 'CONFORME' : 'NAO_CONFORME',
        score: has ? 100 : 0,
        details: has ? 'Procuracao eletronica valida' : 'Procuracao eletronica ausente ou vencida',
      };
    },
  },
  {
    id: 'capacitacao_reforma',
    name: 'Capacitacao Reforma Tributaria',
    weight: 5,
    category: 'Capacitacao',
    evaluate: (entity) => {
      const total = entity.profissionais?.length || 0;
      if (total === 0) {
        return {
          criterionId: 'capacitacao_reforma',
          status: 'NAO_APLICAVEL',
          score: 100,
          details: 'Sem profissionais cadastrados',
        };
      }
      const capacitados = entity.profissionais?.filter((p: any) => p.reformaTributariaCapacitado).length || 0;
      const pct = (capacitados / total) * 100;
      return {
        criterionId: 'capacitacao_reforma',
        status: pct === 100 ? 'CONFORME' : pct > 50 ? 'PARCIAL' : 'NAO_CONFORME',
        score: pct,
        details: `${capacitados}/${total} profissionais capacitados na Reforma Tributaria`,
      };
    },
  },
];

export const TRIBUTO_DOC_CATEGORIES = [
  'certidao_negativa',
  'sped_fiscal',
  'sped_contabil',
  'procuracao',
  'contrato_servico',
  'darf',
  'guia_recolhimento',
  'balancete',
];

export const TRIBUTO_ALERT_TYPES = [
  'DOC_EXPIRY',
  'SPED_DEADLINE',
  'CERTIDAO_RENEWAL',
  'OBRIGACAO_ACESSORIA',
  'DARF_VENCIMENTO',
  'REFORMA_UPDATE',
];
