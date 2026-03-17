import { ComplianceCriterion } from '@compliancecore/shared';

export const LOTE_CRITERIA: ComplianceCriterion[] = [
  {
    id: 'registro_loteamento',
    name: 'Registro do Loteamento',
    weight: 20,
    category: 'Registro',
    evaluate: (entity) => {
      const has = entity.registroCartorio && entity.matriculaNumero;
      return {
        criterionId: 'registro_loteamento',
        status: has ? 'CONFORME' : 'NAO_CONFORME',
        score: has ? 100 : 0,
        details: has
          ? `Loteamento registrado - Matricula ${entity.matriculaNumero}`
          : 'Loteamento sem registro em cartorio',
      };
    },
  },
  {
    id: 'lei_6766_conformidade',
    name: 'Lei 6.766/79 Conformidade',
    weight: 15,
    category: 'Legal',
    evaluate: (entity) => {
      const requisitos = [
        entity.areasPublicasEntregues,
        entity.infraestruturaMinima,
        entity.aprovacaoPrefeitura,
      ];
      const cumpridos = requisitos.filter(Boolean).length;
      const pct = (cumpridos / requisitos.length) * 100;
      return {
        criterionId: 'lei_6766_conformidade',
        status: pct === 100 ? 'CONFORME' : pct > 50 ? 'PARCIAL' : 'NAO_CONFORME',
        score: pct,
        details: `${cumpridos}/${requisitos.length} requisitos da Lei 6.766/79 atendidos`,
      };
    },
  },
  {
    id: 'dimob_em_dia',
    name: 'DIMOB em Dia',
    weight: 15,
    category: 'Fiscal',
    evaluate: (entity) => {
      const has = entity.dimobEntregue;
      return {
        criterionId: 'dimob_em_dia',
        status: has ? 'CONFORME' : 'NAO_CONFORME',
        score: has ? 100 : 0,
        details: has ? 'DIMOB entregue para periodo atual' : 'DIMOB pendente',
      };
    },
  },
  {
    id: 'efd_reinf',
    name: 'EFD-Reinf',
    weight: 10,
    category: 'Fiscal',
    evaluate: (entity) => {
      const has = entity.efdReinfEntregue;
      return {
        criterionId: 'efd_reinf',
        status: has ? 'CONFORME' : 'NAO_CONFORME',
        score: has ? 100 : 0,
        details: has ? 'EFD-Reinf entregue' : 'EFD-Reinf pendente',
      };
    },
  },
  {
    id: 'lgpd_compradores',
    name: 'LGPD Compradores',
    weight: 10,
    category: 'LGPD',
    evaluate: (entity) => {
      const total = entity.compradores?.length || 0;
      if (total === 0) {
        return {
          criterionId: 'lgpd_compradores',
          status: 'NAO_APLICAVEL',
          score: 100,
          details: 'Sem compradores cadastrados',
        };
      }
      const comConsentimento = entity.compradores?.filter(
        (c: any) => c.lgpdConsentimento,
      ).length || 0;
      const pct = (comConsentimento / total) * 100;
      return {
        criterionId: 'lgpd_compradores',
        status: pct === 100 ? 'CONFORME' : pct > 50 ? 'PARCIAL' : 'NAO_CONFORME',
        score: pct,
        details: `${comConsentimento}/${total} compradores com consentimento LGPD`,
      };
    },
  },
  {
    id: 'contratos_registrados',
    name: 'Contratos Registrados',
    weight: 10,
    category: 'Legal',
    evaluate: (entity) => {
      const total = entity.contratos?.length || 0;
      if (total === 0) {
        return {
          criterionId: 'contratos_registrados',
          status: 'NAO_APLICAVEL',
          score: 100,
          details: 'Sem contratos cadastrados',
        };
      }
      const registrados = entity.contratos?.filter(
        (c: any) => c.registrado,
      ).length || 0;
      const pct = (registrados / total) * 100;
      return {
        criterionId: 'contratos_registrados',
        status: pct === 100 ? 'CONFORME' : pct > 50 ? 'PARCIAL' : 'NAO_CONFORME',
        score: pct,
        details: `${registrados}/${total} contratos registrados em cartorio`,
      };
    },
  },
  {
    id: 'infraestrutura_entregue',
    name: 'Infraestrutura Entregue',
    weight: 10,
    category: 'Obra',
    evaluate: (entity) => {
      const itens = [
        entity.infraestrutura?.agua,
        entity.infraestrutura?.esgoto,
        entity.infraestrutura?.energia,
        entity.infraestrutura?.pavimentacao,
        entity.infraestrutura?.drenagem,
      ];
      const entregues = itens.filter(Boolean).length;
      const pct = itens.length > 0 ? (entregues / itens.length) * 100 : 0;
      return {
        criterionId: 'infraestrutura_entregue',
        status: pct === 100 ? 'CONFORME' : pct > 50 ? 'PARCIAL' : 'NAO_CONFORME',
        score: pct,
        details: `${entregues}/${itens.length} itens de infraestrutura entregues`,
      };
    },
  },
  {
    id: 'licenca_ambiental',
    name: 'Licenca Ambiental',
    weight: 10,
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
        details: has ? 'Licenca ambiental valida' : 'Licenca ambiental ausente ou vencida',
      };
    },
  },
];

export const LOTE_DOC_CATEGORIES = [
  'registro_loteamento',
  'matricula_mae',
  'licenca_ambiental',
  'aprovacao_prefeitura',
  'contrato_compra_venda',
  'escritura',
  'dimob',
  'efd_reinf',
  'planta_loteamento',
  'memorial_descritivo',
  'termo_consentimento_lgpd',
];

export const LOTE_ALERT_TYPES = [
  'DOC_EXPIRY',
  'LICENCA_RENEWAL',
  'DIMOB_DEADLINE',
  'EFD_DEADLINE',
  'CONTRATO_REGISTRO',
  'INFRAESTRUTURA_DEADLINE',
  'PARCELA_VENCIMENTO',
];
