import { ComplianceCriterion } from '@compliancecore/shared';

export const OBRA_CRITERIA: ComplianceCriterion[] = [
  {
    id: 'nr18_condicoes_trabalho',
    name: 'NR-18 (Condicoes de Trabalho na Construcao)',
    weight: 20,
    category: 'Seguranca',
    evaluate: (entity) => {
      const has = entity.documents?.some(
        (d: any) =>
          d.category === 'nr18' &&
          (!d.expiresAt || new Date(d.expiresAt) > new Date()),
      );
      return {
        criterionId: 'nr18_condicoes_trabalho',
        status: has ? 'CONFORME' : 'NAO_CONFORME',
        score: has ? 100 : 0,
        details: has
          ? 'Documentacao NR-18 em conformidade'
          : 'Documentacao NR-18 ausente ou vencida',
      };
    },
  },
  {
    id: 'alvara_construcao',
    name: 'Alvara de Construcao',
    weight: 15,
    category: 'Licencas',
    evaluate: (entity) => {
      const has = entity.documents?.some(
        (d: any) =>
          d.category === 'alvara_construcao' &&
          (!d.expiresAt || new Date(d.expiresAt) > new Date()),
      );
      return {
        criterionId: 'alvara_construcao',
        status: has ? 'CONFORME' : 'NAO_CONFORME',
        score: has ? 100 : 0,
        details: has
          ? 'Alvara de construcao valido'
          : 'Alvara de construcao ausente ou vencido',
      };
    },
  },
  {
    id: 'art_rrt',
    name: 'ART/RRT',
    weight: 15,
    category: 'Responsabilidade Tecnica',
    evaluate: (entity) => {
      const has = entity.documents?.some(
        (d: any) =>
          d.category === 'art_rrt' &&
          (!d.expiresAt || new Date(d.expiresAt) > new Date()),
      );
      return {
        criterionId: 'art_rrt',
        status: has ? 'CONFORME' : 'NAO_CONFORME',
        score: has ? 100 : 0,
        details: has
          ? 'ART/RRT registrada e valida'
          : 'ART/RRT ausente ou vencida',
      };
    },
  },
  {
    id: 'licenca_ambiental',
    name: 'Licenca Ambiental',
    weight: 15,
    category: 'Ambiental',
    evaluate: (entity) => {
      const has = entity.documents?.some(
        (d: any) =>
          d.category === 'licenca_ambiental' &&
          (!d.expiresAt || new Date(d.expiresAt) > new Date()),
      );
      return {
        criterionId: 'licenca_ambiental',
        status: has ? 'CONFORME' : 'NAO_CONFORME',
        score: has ? 100 : 0,
        details: has
          ? 'Licenca ambiental valida'
          : 'Licenca ambiental ausente ou vencida',
      };
    },
  },
  {
    id: 'epi_trabalhadores',
    name: 'EPI dos Trabalhadores',
    weight: 10,
    category: 'Seguranca',
    evaluate: (entity) => {
      const total = entity.trabalhadores?.length || 0;
      if (total === 0) {
        return {
          criterionId: 'epi_trabalhadores',
          status: 'NAO_APLICAVEL',
          score: 100,
          details: 'Sem trabalhadores cadastrados',
        };
      }
      const withEpi =
        entity.trabalhadores?.filter((t: any) => t.epiValido).length || 0;
      const pct = (withEpi / total) * 100;
      return {
        criterionId: 'epi_trabalhadores',
        status:
          pct === 100 ? 'CONFORME' : pct > 50 ? 'PARCIAL' : 'NAO_CONFORME',
        score: pct,
        details: `${withEpi}/${total} trabalhadores com EPI valido`,
      };
    },
  },
  {
    id: 'diario_obra',
    name: 'Diario de Obra',
    weight: 10,
    category: 'Documentacao',
    evaluate: (entity) => {
      const has = entity.diarioObra?.atualizado;
      return {
        criterionId: 'diario_obra',
        status: has ? 'CONFORME' : 'NAO_CONFORME',
        score: has ? 100 : 0,
        details: has
          ? 'Diario de obra atualizado'
          : 'Diario de obra desatualizado ou ausente',
      };
    },
  },
  {
    id: 'seguro_responsabilidade',
    name: 'Seguro de Responsabilidade Civil',
    weight: 10,
    category: 'Seguros',
    evaluate: (entity) => {
      const has = entity.documents?.some(
        (d: any) =>
          d.category === 'seguro' &&
          (!d.expiresAt || new Date(d.expiresAt) > new Date()),
      );
      return {
        criterionId: 'seguro_responsabilidade',
        status: has ? 'CONFORME' : 'NAO_CONFORME',
        score: has ? 100 : 0,
        details: has
          ? 'Seguro de responsabilidade civil vigente'
          : 'Seguro de responsabilidade civil ausente ou vencido',
      };
    },
  },
  {
    id: 'pcmso_ppra',
    name: 'PCMSO/PPRA',
    weight: 5,
    category: 'Saude Ocupacional',
    evaluate: (entity) => {
      const hasPcmso = entity.documents?.some(
        (d: any) => d.category === 'pcmso',
      );
      const hasPpra = entity.documents?.some(
        (d: any) => d.category === 'ppra',
      );
      const both = hasPcmso && hasPpra;
      const one = hasPcmso || hasPpra;
      return {
        criterionId: 'pcmso_ppra',
        status: both ? 'CONFORME' : one ? 'PARCIAL' : 'NAO_CONFORME',
        score: both ? 100 : one ? 50 : 0,
        details: both
          ? 'PCMSO e PPRA em dia'
          : one
            ? 'Apenas um dos programas (PCMSO/PPRA) cadastrado'
            : 'PCMSO e PPRA ausentes',
      };
    },
  },
];

export const OBRA_DOC_CATEGORIES = [
  'alvara_construcao',
  'art_rrt',
  'licenca_ambiental',
  'seguro',
  'nr_treinamento',
  'diario_obra',
  'epi_registro',
  'pcmso_ppra',
  'crea_registro',
  'projeto_aprovado',
  'habite_se',
  'nota_fiscal_material',
  'foto_obra',
  'laudo_vistoria',
  'nr18',
  'pcmso',
  'ppra',
  'outro',
] as const;

export type ObraDocCategory = typeof OBRA_DOC_CATEGORIES[number];

export const OBRA_ALERT_TYPES = [
  'DOC_EXPIRY',
  'LICENSE_RENEWAL',
  'ART_RENEWAL',
  'ALVARA_EXPIRY',
  'INSURANCE_EXPIRY',
  'NR_COMPLIANCE',
  'EPI_INSPECTION',
  'ETAPA_DEADLINE',
  'TRAINING_RENEWAL',
  'VISTORIA_SCHEDULED',
] as const;
