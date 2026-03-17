import { ComplianceCriterion } from '@compliancecore/shared';

export const ESTETIK_CRITERIA: ComplianceCriterion[] = [
  {
    id: 'alvara_funcionamento',
    name: 'Alvara de Funcionamento',
    weight: 13,
    category: 'Licencas',
    evaluate: (entity) => {
      const hasAlvara = entity.documents?.some(
        (d: any) =>
          d.category === 'alvara' &&
          (!d.expiresAt || new Date(d.expiresAt) > new Date()),
      );
      return {
        criterionId: 'alvara_funcionamento',
        status: hasAlvara ? 'CONFORME' : 'NAO_CONFORME',
        score: hasAlvara ? 100 : 0,
        details: hasAlvara
          ? 'Alvara de funcionamento valido'
          : 'Alvara de funcionamento ausente ou vencido',
      };
    },
  },
  {
    id: 'licenca_sanitaria',
    name: 'Licenca Sanitaria Vigilancia',
    weight: 18,
    category: 'Licencas',
    evaluate: (entity) => {
      const has = entity.documents?.some(
        (d: any) =>
          d.category === 'licenca_sanitaria' &&
          (!d.expiresAt || new Date(d.expiresAt) > new Date()),
      );
      return {
        criterionId: 'licenca_sanitaria',
        status: has ? 'CONFORME' : 'NAO_CONFORME',
        score: has ? 100 : 0,
        details: has
          ? 'Licenca sanitaria valida'
          : 'Licenca sanitaria ausente ou vencida',
      };
    },
  },
  {
    id: 'registro_anvisa_equipamentos',
    name: 'Registro Anvisa dos Equipamentos',
    weight: 14,
    category: 'Equipamentos',
    evaluate: (entity) => {
      const total = entity.equipamentos?.length || 0;
      if (total === 0) {
        return {
          criterionId: 'registro_anvisa_equipamentos',
          status: 'NAO_APLICAVEL',
          score: 100,
          details: 'Sem equipamentos cadastrados',
        };
      }
      const registered =
        entity.equipamentos?.filter((e: any) => e.registroAnvisa).length || 0;
      const pct = (registered / total) * 100;
      return {
        criterionId: 'registro_anvisa_equipamentos',
        status:
          pct === 100 ? 'CONFORME' : pct > 50 ? 'PARCIAL' : 'NAO_CONFORME',
        score: pct,
        details: `${registered}/${total} equipamentos com registro Anvisa`,
      };
    },
  },
  {
    id: 'pops_atualizados',
    name: 'POPs Atualizados',
    weight: 14,
    category: 'Procedimentos',
    evaluate: (entity) => {
      const total = entity.procedimentos?.length || 0;
      if (total === 0) {
        return {
          criterionId: 'pops_atualizados',
          status: 'NAO_APLICAVEL',
          score: 100,
          details: 'Sem procedimentos cadastrados',
        };
      }
      const withPop =
        entity.procedimentos?.filter(
          (p: any) =>
            p.popId &&
            p.popUpdatedAt &&
            Date.now() - new Date(p.popUpdatedAt).getTime() <
              365 * 24 * 60 * 60 * 1000,
        ).length || 0;
      const pct = (withPop / total) * 100;
      return {
        criterionId: 'pops_atualizados',
        status:
          pct === 100 ? 'CONFORME' : pct > 50 ? 'PARCIAL' : 'NAO_CONFORME',
        score: pct,
        details: `${withPop}/${total} procedimentos com POP atualizado`,
      };
    },
  },
  {
    id: 'lgpd_consentimento',
    name: 'LGPD - Termos de Consentimento',
    weight: 9,
    category: 'LGPD',
    evaluate: (entity) => {
      const has = entity.lgpdTermVersion && entity.lgpdTermAccepted;
      return {
        criterionId: 'lgpd_consentimento',
        status: has ? 'CONFORME' : 'NAO_CONFORME',
        score: has ? 100 : 0,
        details: has
          ? 'Termos LGPD configurados e aceitos'
          : 'Termos LGPD nao configurados',
      };
    },
  },
  {
    id: 'responsavel_tecnico',
    name: 'Responsavel Tecnico (CRM/CRO)',
    weight: 14,
    category: 'Profissionais',
    evaluate: (entity) => {
      const has =
        entity.responsavelTecnico?.crm || entity.responsavelTecnico?.cro;
      return {
        criterionId: 'responsavel_tecnico',
        status: has ? 'CONFORME' : 'NAO_CONFORME',
        score: has ? 100 : 0,
        details: has
          ? `RT: ${entity.responsavelTecnico.nome} (${entity.responsavelTecnico.crm || entity.responsavelTecnico.cro})`
          : 'Responsavel tecnico nao cadastrado',
      };
    },
  },
  {
    id: 'treinamento_equipe',
    name: 'Treinamento da Equipe',
    weight: 8,
    category: 'Profissionais',
    evaluate: (entity) => {
      const total = entity.profissionais?.length || 0;
      if (total === 0) {
        return {
          criterionId: 'treinamento_equipe',
          status: 'NAO_APLICAVEL',
          score: 100,
          details: 'Sem profissionais cadastrados',
        };
      }
      const trained =
        entity.profissionais?.filter((p: any) => p.treinamentoValido).length ||
        0;
      const pct = (trained / total) * 100;
      return {
        criterionId: 'treinamento_equipe',
        status:
          pct === 100 ? 'CONFORME' : pct > 50 ? 'PARCIAL' : 'NAO_CONFORME',
        score: pct,
        details: `${trained}/${total} profissionais com treinamento valido`,
      };
    },
  },
  {
    id: 'pgrss',
    name: 'PGRSS - Gerenciamento de Residuos',
    weight: 5,
    category: 'Meio Ambiente',
    evaluate: (entity) => {
      const has = entity.pgrss?.implementado && entity.pgrss?.atualizado;
      return {
        criterionId: 'pgrss',
        status: has ? 'CONFORME' : entity.pgrss?.implementado ? 'PARCIAL' : 'NAO_CONFORME',
        score: has ? 100 : entity.pgrss?.implementado ? 50 : 0,
        details: has
          ? 'PGRSS implementado e atualizado'
          : entity.pgrss?.implementado
            ? 'PGRSS implementado mas desatualizado'
            : 'PGRSS nao implementado',
      };
    },
  },
  {
    id: 'infraestrutura',
    name: 'Infraestrutura e Seguranca',
    weight: 5,
    category: 'Infraestrutura',
    evaluate: (entity) => {
      const checks = [
        entity.infraestrutura?.extintorValido,
        entity.infraestrutura?.saidaEmergencia,
        entity.infraestrutura?.acessibilidade,
        entity.infraestrutura?.sinalizacao,
      ];
      const total = checks.length;
      const passed = checks.filter(Boolean).length;
      const pct = (passed / total) * 100;
      return {
        criterionId: 'infraestrutura',
        status: pct === 100 ? 'CONFORME' : pct >= 50 ? 'PARCIAL' : 'NAO_CONFORME',
        score: pct,
        details: `${passed}/${total} itens de infraestrutura conformes`,
      };
    },
  },
];

export const ESTETIK_DOC_CATEGORIES = [
  'alvara',
  'licenca_sanitaria',
  'registro_anvisa',
  'pop',
  'tcle',
  'contrato',
  'laudo_tecnico',
  'certificado_treinamento',
  'manual_equipamento',
  'nota_fiscal',
  'foto_antes_depois',
  'pgrss',
  'laudo_pgrss',
  'outro',
];

export const ESTETIK_ALERT_TYPES = [
  'DOC_EXPIRY',
  'LICENSE_RENEWAL',
  'EQUIPMENT_CALIBRATION',
  'TRAINING_RENEWAL',
  'POP_REVIEW',
  'ANVISA_REGISTRATION',
  'PGRSS_REVIEW',
  'INFRA_INSPECTION',
];
