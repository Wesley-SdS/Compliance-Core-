import { ComplianceCriterion } from '@compliancecore/shared';

export const LAUDO_CRITERIA: ComplianceCriterion[] = [
  {
    id: 'certificacao_sbpc',
    name: 'Certificacao SBPC/ML',
    weight: 20,
    category: 'Certificacoes',
    evaluate: (entity) => {
      const has = entity.documents?.some(
        (d: any) =>
          d.category === 'certificacao_sbpc' &&
          (!d.expiresAt || new Date(d.expiresAt) > new Date()),
      );
      return {
        criterionId: 'certificacao_sbpc',
        status: has ? 'CONFORME' : 'NAO_CONFORME',
        score: has ? 100 : 0,
        details: has
          ? 'Certificacao SBPC/ML valida'
          : 'Certificacao SBPC/ML ausente ou vencida',
      };
    },
  },
  {
    id: 'controle_qualidade_interno',
    name: 'Controle Qualidade Interno',
    weight: 15,
    category: 'Qualidade',
    evaluate: (entity) => {
      const has = entity.controleQualidade?.interno === true;
      return {
        criterionId: 'controle_qualidade_interno',
        status: has ? 'CONFORME' : 'NAO_CONFORME',
        score: has ? 100 : 0,
        details: has
          ? 'Controle de qualidade interno implementado'
          : 'Controle de qualidade interno nao implementado',
      };
    },
  },
  {
    id: 'proficiencia_ensaio',
    name: 'Proficiencia (Ensaio)',
    weight: 15,
    category: 'Qualidade',
    evaluate: (entity) => {
      const total = entity.ensaiosProficiencia?.length || 0;
      if (total === 0) {
        return {
          criterionId: 'proficiencia_ensaio',
          status: 'NAO_APLICAVEL',
          score: 100,
          details: 'Sem ensaios de proficiencia cadastrados',
        };
      }
      const aprovados = entity.ensaiosProficiencia?.filter((e: any) => e.resultado === 'APROVADO').length || 0;
      const pct = (aprovados / total) * 100;
      return {
        criterionId: 'proficiencia_ensaio',
        status: pct === 100 ? 'CONFORME' : pct > 50 ? 'PARCIAL' : 'NAO_CONFORME',
        score: pct,
        details: `${aprovados}/${total} ensaios de proficiencia aprovados`,
      };
    },
  },
  {
    id: 'rastreabilidade_metrologica',
    name: 'Rastreabilidade Metrologica',
    weight: 15,
    category: 'Metrologia',
    evaluate: (entity) => {
      const total = entity.equipamentos?.length || 0;
      if (total === 0) {
        return {
          criterionId: 'rastreabilidade_metrologica',
          status: 'NAO_APLICAVEL',
          score: 100,
          details: 'Sem equipamentos cadastrados',
        };
      }
      const calibrados = entity.equipamentos?.filter(
        (e: any) => e.calibracaoValida && e.rastreabilidade,
      ).length || 0;
      const pct = (calibrados / total) * 100;
      return {
        criterionId: 'rastreabilidade_metrologica',
        status: pct === 100 ? 'CONFORME' : pct > 50 ? 'PARCIAL' : 'NAO_CONFORME',
        score: pct,
        details: `${calibrados}/${total} equipamentos com rastreabilidade metrologica`,
      };
    },
  },
  {
    id: 'pop_exames',
    name: 'POP de Exames',
    weight: 10,
    category: 'Procedimentos',
    evaluate: (entity) => {
      const total = entity.exames?.length || 0;
      if (total === 0) {
        return {
          criterionId: 'pop_exames',
          status: 'NAO_APLICAVEL',
          score: 100,
          details: 'Sem exames cadastrados',
        };
      }
      const withPop = entity.exames?.filter((e: any) => e.popAtualizado).length || 0;
      const pct = (withPop / total) * 100;
      return {
        criterionId: 'pop_exames',
        status: pct === 100 ? 'CONFORME' : pct > 50 ? 'PARCIAL' : 'NAO_CONFORME',
        score: pct,
        details: `${withPop}/${total} exames com POP atualizado`,
      };
    },
  },
  {
    id: 'qualificacao_equipe',
    name: 'Qualificacao da Equipe',
    weight: 10,
    category: 'Pessoal',
    evaluate: (entity) => {
      const total = entity.profissionais?.length || 0;
      if (total === 0) {
        return {
          criterionId: 'qualificacao_equipe',
          status: 'NAO_APLICAVEL',
          score: 100,
          details: 'Sem profissionais cadastrados',
        };
      }
      const qualificados = entity.profissionais?.filter((p: any) => p.qualificado).length || 0;
      const pct = (qualificados / total) * 100;
      return {
        criterionId: 'qualificacao_equipe',
        status: pct === 100 ? 'CONFORME' : pct > 50 ? 'PARCIAL' : 'NAO_CONFORME',
        score: pct,
        details: `${qualificados}/${total} profissionais qualificados`,
      };
    },
  },
  {
    id: 'descarte_residuos',
    name: 'Descarte de Residuos',
    weight: 10,
    category: 'Ambiental',
    evaluate: (entity) => {
      const has = entity.descarteResiduos?.conformidade;
      return {
        criterionId: 'descarte_residuos',
        status: has ? 'CONFORME' : 'NAO_CONFORME',
        score: has ? 100 : 0,
        details: has
          ? 'Plano de descarte de residuos em conformidade'
          : 'Plano de descarte de residuos nao conforme',
      };
    },
  },
  {
    id: 'manual_qualidade',
    name: 'Manual da Qualidade',
    weight: 5,
    category: 'Documentacao',
    evaluate: (entity) => {
      const has = entity.documents?.some(
        (d: any) => d.category === 'manual_qualidade',
      );
      return {
        criterionId: 'manual_qualidade',
        status: has ? 'CONFORME' : 'NAO_CONFORME',
        score: has ? 100 : 0,
        details: has
          ? 'Manual da qualidade cadastrado'
          : 'Manual da qualidade ausente',
      };
    },
  },
];

export const LAUDO_DOC_CATEGORIES = [
  'certificacao_sbpc',
  'manual_qualidade',
  'pop_exame',
  'laudo_resultado',
  'certificado_calibracao',
  'ensaio_proficiencia',
  'plano_descarte',
  'treinamento_certificado',
  'licenca_sanitaria',
  'alvara',
];

export const LAUDO_ALERT_TYPES = [
  'DOC_EXPIRY',
  'CALIBRACAO_VENCIMENTO',
  'PROFICIENCIA_DEADLINE',
  'POP_REVIEW',
  'CERTIFICACAO_RENEWAL',
  'LICENCA_RENEWAL',
];
