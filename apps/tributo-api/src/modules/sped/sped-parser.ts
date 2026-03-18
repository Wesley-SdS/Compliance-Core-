/**
 * Parser real para arquivos SPED EFD (Escrituração Fiscal Digital)
 *
 * Formato: registros pipe-delimited (|REG|campo1|campo2|...|)
 * Referência: Guia Prático EFD-ICMS/IPI e EFD-Contribuições
 */

export interface SpedRegistro0000 {
  reg: '0000';
  codVer: string;
  codFin: string;
  dtIni: string;
  dtFin: string;
  nome: string;
  cnpj: string;
  cpf: string;
  uf: string;
  ie: string;
  codMun: string;
  im: string;
  suframa: string;
  indPerfil: string;
  indAtiv: string;
}

export interface SpedRegistro0200 {
  reg: '0200';
  codItem: string;
  descrItem: string;
  codBarra: string;
  codAntItem: string;
  unidInv: string;
  tipoItem: string;
  codNcm: string;
  exIpi: string;
  codGen: string;
  codLst: string;
  aliqIcms: number;
}

export interface SpedRegistroC100 {
  reg: 'C100';
  indOper: string; // 0=Entrada, 1=Saída
  indEmit: string; // 0=Própria, 1=Terceiros
  codPart: string;
  codMod: string;
  codSit: string;
  ser: string;
  numDoc: string;
  chvNfe: string;
  dtDoc: string;
  dtES: string;
  vlDoc: number;
  indPgto: string;
  vlDesc: number;
  vlAbatNt: number;
  vlMerc: number;
  indFrt: string;
  vlFrt: number;
  vlSeg: number;
  vlOutDa: number;
  vlBcIcms: number;
  vlIcms: number;
  vlBcIcmsSt: number;
  vlIcmsSt: number;
  vlIpi: number;
  vlPis: number;
  vlCofins: number;
  vlPisSt: number;
  vlCofinsSt: number;
}

export interface SpedRegistroC170 {
  reg: 'C170';
  numItem: string;
  codItem: string;
  descrCompl: string;
  qtd: number;
  unid: string;
  vlItem: number;
  vlDesc: number;
  indMov: string;
  cstIcms: string;
  cfop: string;
  codNat: string;
  vlBcIcms: number;
  aliqIcms: number;
  vlIcms: number;
  vlBcIcmsSt: number;
  aliqSt: number;
  vlIcmsSt: number;
  indApur: string;
  cstIpi: string;
  codEnqIpi: string;
  vlBcIpi: number;
  aliqIpi: number;
  vlIpi: number;
  cstPis: string;
  vlBcPis: number;
  aliqPis: number;
  vlPis: number;
  cstCofins: string;
  vlBcCofins: number;
  aliqCofins: number;
  vlCofins: number;
  codCta: string;
  ncm?: string;
}

export interface SpedRegistroD100 {
  reg: 'D100';
  indOper: string;
  indEmit: string;
  codPart: string;
  codMod: string;
  codSit: string;
  ser: string;
  numDoc: string;
  dtDoc: string;
  dtAP: string;
  vlDoc: number;
  vlDesc: number;
  indFrt: string;
  vlServ: number;
  vlBcIcms: number;
  vlIcms: number;
  vlNt: number;
  codInf: string;
  codCta: string;
}

export interface SpedRegistroD500 {
  reg: 'D500';
  indOper: string;
  indEmit: string;
  codPart: string;
  codMod: string;
  codSit: string;
  ser: string;
  numDoc: string;
  dtDoc: string;
  dtAP: string;
  vlDoc: number;
  vlDesc: number;
  vlServ: number;
  vlServNt: number;
  vlTerc: number;
  vlDa: number;
  vlBcIcms: number;
  vlIcms: number;
  codInf: string;
  vlPis: number;
  vlCofins: number;
}

export interface SpedParseResult {
  abertura: SpedRegistro0000 | null;
  notasFiscais: SpedRegistroC100[];
  itensNF: SpedRegistroC170[];
  transportes: SpedRegistroD100[];
  comunicacoes: SpedRegistroD500[];
  totalRegistros: number;
  erros: string[];
  resumo: {
    totalNotas: number;
    totalItens: number;
    valorTotalEntradas: number;
    valorTotalSaidas: number;
    icmsTotal: number;
    pisTotal: number;
    cofinsTotal: number;
    ipiTotal: number;
    periodoInicio: string | null;
    periodoFim: string | null;
    cnpj: string | null;
    razaoSocial: string | null;
  };
}

export class SpedParser {
  /**
   * Parseia conteúdo de arquivo SPED EFD (texto pipe-delimited)
   * Aceita conteúdo em texto ou base64
   */
  parse(content: string): SpedParseResult {
    const text = this.decodeContent(content);
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);

    // Mapa de COD_ITEM -> NCM (vindo do registro 0200)
    const itemNcmMap = new Map<string, string>();

    const result: SpedParseResult = {
      abertura: null,
      notasFiscais: [],
      itensNF: [],
      transportes: [],
      comunicacoes: [],
      totalRegistros: 0,
      erros: [],
      resumo: {
        totalNotas: 0,
        totalItens: 0,
        valorTotalEntradas: 0,
        valorTotalSaidas: 0,
        icmsTotal: 0,
        pisTotal: 0,
        cofinsTotal: 0,
        ipiTotal: 0,
        periodoInicio: null,
        periodoFim: null,
        cnpj: null,
        razaoSocial: null,
      },
    };

    for (let i = 0; i < lines.length; i++) {
      try {
        const campos = this.splitLine(lines[i]);
        if (campos.length < 2) continue;

        const reg = campos[1];
        result.totalRegistros++;

        switch (reg) {
          case '0000':
            result.abertura = this.parse0000(campos);
            result.resumo.periodoInicio = result.abertura.dtIni;
            result.resumo.periodoFim = result.abertura.dtFin;
            result.resumo.cnpj = result.abertura.cnpj;
            result.resumo.razaoSocial = result.abertura.nome;
            break;
          case '0200': {
            const reg0200 = this.parse0200(campos);
            if (reg0200.codItem && reg0200.codNcm) {
              itemNcmMap.set(reg0200.codItem, reg0200.codNcm);
            }
            break;
          }
          case 'C100':
            const nf = this.parseC100(campos);
            result.notasFiscais.push(nf);
            if (nf.indOper === '0') {
              result.resumo.valorTotalEntradas += nf.vlDoc;
            } else {
              result.resumo.valorTotalSaidas += nf.vlDoc;
            }
            result.resumo.icmsTotal += nf.vlIcms;
            result.resumo.pisTotal += nf.vlPis;
            result.resumo.cofinsTotal += nf.vlCofins;
            result.resumo.ipiTotal += nf.vlIpi;
            break;
          case 'C170': {
            const item = this.parseC170(campos);
            const ncm = itemNcmMap.get(item.codItem);
            if (ncm) {
              item.ncm = ncm;
            }
            result.itensNF.push(item);
            break;
          }
          case 'D100':
            result.transportes.push(this.parseD100(campos));
            break;
          case 'D500':
            result.comunicacoes.push(this.parseD500(campos));
            break;
        }
      } catch (err: any) {
        result.erros.push(`Linha ${i + 1}: ${err.message}`);
      }
    }

    result.resumo.totalNotas = result.notasFiscais.length;
    result.resumo.totalItens = result.itensNF.length;
    result.resumo.valorTotalEntradas = this.round(result.resumo.valorTotalEntradas);
    result.resumo.valorTotalSaidas = this.round(result.resumo.valorTotalSaidas);
    result.resumo.icmsTotal = this.round(result.resumo.icmsTotal);
    result.resumo.pisTotal = this.round(result.resumo.pisTotal);
    result.resumo.cofinsTotal = this.round(result.resumo.cofinsTotal);
    result.resumo.ipiTotal = this.round(result.resumo.ipiTotal);

    return result;
  }

  private decodeContent(content: string): string {
    // Detecta se é base64 (não contém pipe no início)
    if (!content.startsWith('|') && /^[A-Za-z0-9+/=\r\n]+$/.test(content.substring(0, 100))) {
      return Buffer.from(content, 'base64').toString('utf-8');
    }
    return content;
  }

  private splitLine(line: string): string[] {
    // Remove pipes inicial e final, split por pipe
    const trimmed = line.trim();
    return trimmed.split('|');
  }

  private str(campos: string[], idx: number): string {
    return (campos[idx] ?? '').trim();
  }

  private num(campos: string[], idx: number): number {
    const val = (campos[idx] ?? '').trim().replace(',', '.');
    return val ? parseFloat(val) || 0 : 0;
  }

  private parse0000(campos: string[]): SpedRegistro0000 {
    return {
      reg: '0000',
      codVer: this.str(campos, 2),
      codFin: this.str(campos, 3),
      dtIni: this.str(campos, 4),
      dtFin: this.str(campos, 5),
      nome: this.str(campos, 6),
      cnpj: this.str(campos, 7),
      cpf: this.str(campos, 8),
      uf: this.str(campos, 9),
      ie: this.str(campos, 10),
      codMun: this.str(campos, 11),
      im: this.str(campos, 12),
      suframa: this.str(campos, 13),
      indPerfil: this.str(campos, 14),
      indAtiv: this.str(campos, 15),
    };
  }

  private parse0200(campos: string[]): SpedRegistro0200 {
    return {
      reg: '0200',
      codItem: this.str(campos, 2),
      descrItem: this.str(campos, 3),
      codBarra: this.str(campos, 4),
      codAntItem: this.str(campos, 5),
      unidInv: this.str(campos, 6),
      tipoItem: this.str(campos, 7),
      codNcm: this.str(campos, 8),
      exIpi: this.str(campos, 9),
      codGen: this.str(campos, 10),
      codLst: this.str(campos, 11),
      aliqIcms: this.num(campos, 12),
    };
  }

  private parseC100(campos: string[]): SpedRegistroC100 {
    return {
      reg: 'C100',
      indOper: this.str(campos, 2),
      indEmit: this.str(campos, 3),
      codPart: this.str(campos, 4),
      codMod: this.str(campos, 5),
      codSit: this.str(campos, 6),
      ser: this.str(campos, 7),
      numDoc: this.str(campos, 8),
      chvNfe: this.str(campos, 9),
      dtDoc: this.str(campos, 10),
      dtES: this.str(campos, 11),
      vlDoc: this.num(campos, 12),
      indPgto: this.str(campos, 13),
      vlDesc: this.num(campos, 14),
      vlAbatNt: this.num(campos, 15),
      vlMerc: this.num(campos, 16),
      indFrt: this.str(campos, 17),
      vlFrt: this.num(campos, 18),
      vlSeg: this.num(campos, 19),
      vlOutDa: this.num(campos, 20),
      vlBcIcms: this.num(campos, 21),
      vlIcms: this.num(campos, 22),
      vlBcIcmsSt: this.num(campos, 23),
      vlIcmsSt: this.num(campos, 24),
      vlIpi: this.num(campos, 25),
      vlPis: this.num(campos, 26),
      vlCofins: this.num(campos, 27),
      vlPisSt: this.num(campos, 28),
      vlCofinsSt: this.num(campos, 29),
    };
  }

  private parseC170(campos: string[]): SpedRegistroC170 {
    return {
      reg: 'C170',
      numItem: this.str(campos, 2),
      codItem: this.str(campos, 3),
      descrCompl: this.str(campos, 4),
      qtd: this.num(campos, 5),
      unid: this.str(campos, 6),
      vlItem: this.num(campos, 7),
      vlDesc: this.num(campos, 8),
      indMov: this.str(campos, 9),
      cstIcms: this.str(campos, 10),
      cfop: this.str(campos, 11),
      codNat: this.str(campos, 12),
      vlBcIcms: this.num(campos, 13),
      aliqIcms: this.num(campos, 14),
      vlIcms: this.num(campos, 15),
      vlBcIcmsSt: this.num(campos, 16),
      aliqSt: this.num(campos, 17),
      vlIcmsSt: this.num(campos, 18),
      indApur: this.str(campos, 19),
      cstIpi: this.str(campos, 20),
      codEnqIpi: this.str(campos, 21),
      vlBcIpi: this.num(campos, 22),
      aliqIpi: this.num(campos, 23),
      vlIpi: this.num(campos, 24),
      cstPis: this.str(campos, 25),
      vlBcPis: this.num(campos, 26),
      aliqPis: this.num(campos, 27),
      vlPis: this.num(campos, 28),
      cstCofins: this.str(campos, 29),
      vlBcCofins: this.num(campos, 30),
      aliqCofins: this.num(campos, 31),
      vlCofins: this.num(campos, 32),
      codCta: this.str(campos, 33),
    };
  }

  private parseD100(campos: string[]): SpedRegistroD100 {
    return {
      reg: 'D100',
      indOper: this.str(campos, 2),
      indEmit: this.str(campos, 3),
      codPart: this.str(campos, 4),
      codMod: this.str(campos, 5),
      codSit: this.str(campos, 6),
      ser: this.str(campos, 7),
      numDoc: this.str(campos, 8),
      dtDoc: this.str(campos, 9),
      dtAP: this.str(campos, 10),
      vlDoc: this.num(campos, 11),
      vlDesc: this.num(campos, 12),
      indFrt: this.str(campos, 13),
      vlServ: this.num(campos, 14),
      vlBcIcms: this.num(campos, 15),
      vlIcms: this.num(campos, 16),
      vlNt: this.num(campos, 17),
      codInf: this.str(campos, 18),
      codCta: this.str(campos, 19),
    };
  }

  private parseD500(campos: string[]): SpedRegistroD500 {
    return {
      reg: 'D500',
      indOper: this.str(campos, 2),
      indEmit: this.str(campos, 3),
      codPart: this.str(campos, 4),
      codMod: this.str(campos, 5),
      codSit: this.str(campos, 6),
      ser: this.str(campos, 7),
      numDoc: this.str(campos, 8),
      dtDoc: this.str(campos, 9),
      dtAP: this.str(campos, 10),
      vlDoc: this.num(campos, 11),
      vlDesc: this.num(campos, 12),
      vlServ: this.num(campos, 13),
      vlServNt: this.num(campos, 14),
      vlTerc: this.num(campos, 15),
      vlDa: this.num(campos, 16),
      vlBcIcms: this.num(campos, 17),
      vlIcms: this.num(campos, 18),
      codInf: this.str(campos, 19),
      vlPis: this.num(campos, 20),
      vlCofins: this.num(campos, 21),
    };
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
