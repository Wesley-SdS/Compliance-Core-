import { ComplianceCriterion } from '@compliancecore/shared';

export const FROTA_CRITERIA: ComplianceCriterion[] = [
  {
    id: 'ciot_em_dia',
    name: 'CIOT em Dia',
    weight: 15,
    category: 'Documentacao',
    evaluate: (entity) => {
      const total = entity.viagens?.filter((v: any) => v.status === 'EM_ANDAMENTO').length || 0;
      if (total === 0) {
        return {
          criterionId: 'ciot_em_dia',
          status: 'NAO_APLICAVEL',
          score: 100,
          details: 'Sem viagens em andamento',
        };
      }
      const comCiot = entity.viagens?.filter(
        (v: any) => v.status === 'EM_ANDAMENTO' && v.ciotNumero,
      ).length || 0;
      const pct = (comCiot / total) * 100;
      return {
        criterionId: 'ciot_em_dia',
        status: pct === 100 ? 'CONFORME' : pct > 50 ? 'PARCIAL' : 'NAO_CONFORME',
        score: pct,
        details: `${comCiot}/${total} viagens com CIOT registrado`,
      };
    },
  },
  {
    id: 'cnh_motoristas',
    name: 'CNH Motoristas Valida',
    weight: 15,
    category: 'Motoristas',
    evaluate: (entity) => {
      const total = entity.motoristas?.length || 0;
      if (total === 0) {
        return {
          criterionId: 'cnh_motoristas',
          status: 'NAO_APLICAVEL',
          score: 100,
          details: 'Sem motoristas cadastrados',
        };
      }
      const validos = entity.motoristas?.filter(
        (m: any) => m.cnhValidade && new Date(m.cnhValidade) > new Date(),
      ).length || 0;
      const pct = (validos / total) * 100;
      return {
        criterionId: 'cnh_motoristas',
        status: pct === 100 ? 'CONFORME' : pct > 50 ? 'PARCIAL' : 'NAO_CONFORME',
        score: pct,
        details: `${validos}/${total} motoristas com CNH valida`,
      };
    },
  },
  {
    id: 'documentacao_veicular',
    name: 'Documentacao Veicular',
    weight: 15,
    category: 'Veiculos',
    evaluate: (entity) => {
      const total = entity.veiculos?.length || 0;
      if (total === 0) {
        return {
          criterionId: 'documentacao_veicular',
          status: 'NAO_APLICAVEL',
          score: 100,
          details: 'Sem veiculos cadastrados',
        };
      }
      const docOk = entity.veiculos?.filter(
        (v: any) => v.crlvValido && v.ipvaQuitado,
      ).length || 0;
      const pct = (docOk / total) * 100;
      return {
        criterionId: 'documentacao_veicular',
        status: pct === 100 ? 'CONFORME' : pct > 50 ? 'PARCIAL' : 'NAO_CONFORME',
        score: pct,
        details: `${docOk}/${total} veiculos com documentacao em dia`,
      };
    },
  },
  {
    id: 'tacografo_aferido',
    name: 'Tacografo Aferido',
    weight: 15,
    category: 'Veiculos',
    evaluate: (entity) => {
      const total = entity.veiculos?.filter((v: any) => v.temTacografo).length || 0;
      if (total === 0) {
        return {
          criterionId: 'tacografo_aferido',
          status: 'NAO_APLICAVEL',
          score: 100,
          details: 'Sem veiculos com tacografo',
        };
      }
      const aferidos = entity.veiculos?.filter(
        (v: any) => v.temTacografo && v.tacografoAferido &&
          (!v.tacografoValidade || new Date(v.tacografoValidade) > new Date()),
      ).length || 0;
      const pct = (aferidos / total) * 100;
      return {
        criterionId: 'tacografo_aferido',
        status: pct === 100 ? 'CONFORME' : pct > 50 ? 'PARCIAL' : 'NAO_CONFORME',
        score: pct,
        details: `${aferidos}/${total} tacografos aferidos e validos`,
      };
    },
  },
  {
    id: 'lei_descanso',
    name: 'Lei do Descanso',
    weight: 15,
    category: 'Motoristas',
    evaluate: (entity) => {
      const total = entity.motoristas?.filter((m: any) => m.emViagem).length || 0;
      if (total === 0) {
        return {
          criterionId: 'lei_descanso',
          status: 'NAO_APLICAVEL',
          score: 100,
          details: 'Sem motoristas em viagem',
        };
      }
      const conformes = entity.motoristas?.filter(
        (m: any) => m.emViagem && m.descansoConforme,
      ).length || 0;
      const pct = (conformes / total) * 100;
      return {
        criterionId: 'lei_descanso',
        status: pct === 100 ? 'CONFORME' : pct > 50 ? 'PARCIAL' : 'NAO_CONFORME',
        score: pct,
        details: `${conformes}/${total} motoristas em conformidade com Lei do Descanso`,
      };
    },
  },
  {
    id: 'manutencao_preventiva',
    name: 'Manutencao Preventiva',
    weight: 10,
    category: 'Veiculos',
    evaluate: (entity) => {
      const total = entity.veiculos?.length || 0;
      if (total === 0) {
        return {
          criterionId: 'manutencao_preventiva',
          status: 'NAO_APLICAVEL',
          score: 100,
          details: 'Sem veiculos cadastrados',
        };
      }
      const emDia = entity.veiculos?.filter(
        (v: any) => v.manutencaoEmDia,
      ).length || 0;
      const pct = (emDia / total) * 100;
      return {
        criterionId: 'manutencao_preventiva',
        status: pct === 100 ? 'CONFORME' : pct > 50 ? 'PARCIAL' : 'NAO_CONFORME',
        score: pct,
        details: `${emDia}/${total} veiculos com manutencao preventiva em dia`,
      };
    },
  },
  {
    id: 'seguro_obrigatorio',
    name: 'Seguro Obrigatorio',
    weight: 10,
    category: 'Seguros',
    evaluate: (entity) => {
      const total = entity.veiculos?.length || 0;
      if (total === 0) {
        return {
          criterionId: 'seguro_obrigatorio',
          status: 'NAO_APLICAVEL',
          score: 100,
          details: 'Sem veiculos cadastrados',
        };
      }
      const segurados = entity.veiculos?.filter(
        (v: any) => v.seguroValido,
      ).length || 0;
      const pct = (segurados / total) * 100;
      return {
        criterionId: 'seguro_obrigatorio',
        status: pct === 100 ? 'CONFORME' : pct > 50 ? 'PARCIAL' : 'NAO_CONFORME',
        score: pct,
        details: `${segurados}/${total} veiculos com seguro obrigatorio valido`,
      };
    },
  },
  {
    id: 'curso_mopp',
    name: 'Curso MOPP (se perigoso)',
    weight: 5,
    category: 'Motoristas',
    evaluate: (entity) => {
      const motoristasPerigoso = entity.motoristas?.filter(
        (m: any) => m.transportaPerigoso,
      ) || [];
      if (motoristasPerigoso.length === 0) {
        return {
          criterionId: 'curso_mopp',
          status: 'NAO_APLICAVEL',
          score: 100,
          details: 'Sem motoristas de carga perigosa',
        };
      }
      const comMopp = motoristasPerigoso.filter((m: any) => m.moppValido).length;
      const pct = (comMopp / motoristasPerigoso.length) * 100;
      return {
        criterionId: 'curso_mopp',
        status: pct === 100 ? 'CONFORME' : pct > 50 ? 'PARCIAL' : 'NAO_CONFORME',
        score: pct,
        details: `${comMopp}/${motoristasPerigoso.length} motoristas de perigoso com MOPP valido`,
      };
    },
  },
];

export const FROTA_DOC_CATEGORIES = [
  'crlv',
  'cnh',
  'ciot',
  'seguro',
  'tacografo_certificado',
  'manutencao_ordem_servico',
  'mopp_certificado',
  'contrato_frete',
  'manifesto_carga',
  'multa',
];

export const FROTA_ALERT_TYPES = [
  'DOC_EXPIRY',
  'CNH_VENCIMENTO',
  'CRLV_VENCIMENTO',
  'TACOGRAFO_AFERICAO',
  'MANUTENCAO_PREVENTIVA',
  'SEGURO_VENCIMENTO',
  'MOPP_VENCIMENTO',
  'DESCANSO_OBRIGATORIO',
];
