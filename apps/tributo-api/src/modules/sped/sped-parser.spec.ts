import { describe, it, expect } from 'vitest';
import { SpedParser } from './sped-parser';

describe('SpedParser', () => {
  const parser = new SpedParser();

  const SPED_SAMPLE = [
    '|0000|017|0|01012025|31012025|EMPRESA TESTE LTDA|12345678000190||SP|123456789|3550308|||A|1|',
    '|0200|PROD001|PRODUTO TESTE A|7891234567890||UN|00|84713012||||18,00|',
    '|0200|PROD002|PRODUTO TESTE B|7891234567891||UN|00|61051000||||12,00|',
    '|C100|0|0|FORN001|55|00|001|000001|12345678901234567890123456789012345678901234|01012025|01012025|15000,00|0|500,00|0|14500,00|0|200,00|50,00|100,00|14500,00|2610,00|0|0|300,00|247,50|1140,00|0|0|',
    '|C100|1|0|CLI001|55|00|001|000002|98765432109876543210987654321098765432109876|15012025|15012025|25000,00|0|0|0|25000,00|1|0|0|0|25000,00|4500,00|0|0|0|412,50|1900,00|0|0|',
    '|C170|001|PROD001|PRODUTO TESTE A|10|UN|5000,00|0|0|000|5102|001|5000,00|18,00|900,00|0|0|0|0|50||0|0|0|01|5000,00|1,65|82,50|01|5000,00|7,60|380,00|CONTA001|',
    '|D100|0|1|TRANS001|57|00|001|000100|15012025|15012025|3000,00|0|0|3000,00|3000,00|360,00|0||CONTA002|',
    '|D500|0|1|TEL001|21|00|001|555000|20012025|20012025|800,00|0|800,00|0|0|0|800,00|96,00||13,20|60,80|',
    '|9999|7|',
  ].join('\n');

  describe('parse', () => {
    it('parseia registro 0000 (abertura)', () => {
      const result = parser.parse(SPED_SAMPLE);

      expect(result.abertura).not.toBeNull();
      expect(result.abertura!.cnpj).toBe('12345678000190');
      expect(result.abertura!.nome).toBe('EMPRESA TESTE LTDA');
      expect(result.abertura!.uf).toBe('SP');
      expect(result.abertura!.dtIni).toBe('01012025');
      expect(result.abertura!.dtFin).toBe('31012025');
    });

    it('parseia registros C100 (notas fiscais)', () => {
      const result = parser.parse(SPED_SAMPLE);

      expect(result.notasFiscais).toHaveLength(2);
      expect(result.notasFiscais[0].indOper).toBe('0'); // Entrada
      expect(result.notasFiscais[0].vlDoc).toBe(15000);
      expect(result.notasFiscais[0].vlIcms).toBe(2610);
      expect(result.notasFiscais[1].indOper).toBe('1'); // Saída
      expect(result.notasFiscais[1].vlDoc).toBe(25000);
    });

    it('parseia registros C170 (itens)', () => {
      const result = parser.parse(SPED_SAMPLE);

      expect(result.itensNF).toHaveLength(1);
      expect(result.itensNF[0].codItem).toBe('PROD001');
      expect(result.itensNF[0].vlItem).toBe(5000);
      expect(result.itensNF[0].aliqIcms).toBe(18);
      expect(result.itensNF[0].vlPis).toBe(82.5);
      expect(result.itensNF[0].vlCofins).toBe(380);
    });

    it('resolve NCM de C170 via registro 0200', () => {
      const result = parser.parse(SPED_SAMPLE);

      expect(result.itensNF).toHaveLength(1);
      expect(result.itensNF[0].ncm).toBe('84713012');
    });

    it('NCM fica undefined quando item nao tem registro 0200', () => {
      const semRegistro0200 = [
        '|0000|017|0|01012025|31012025|EMPRESA||||||||||',
        '|C170|001|ITEM_SEM_0200|DESC|1|UN|100,00|0|0|000|5102|001|100,00|18,00|18,00|0|0|0|0|50||0|0|0|01|100,00|1,65|1,65|01|100,00|7,60|7,60|CONTA|',
      ].join('\n');
      const result = parser.parse(semRegistro0200);

      expect(result.itensNF).toHaveLength(1);
      expect(result.itensNF[0].ncm).toBeUndefined();
    });

    it('parseia registros D100 (transporte)', () => {
      const result = parser.parse(SPED_SAMPLE);

      expect(result.transportes).toHaveLength(1);
      expect(result.transportes[0].vlDoc).toBe(3000);
      expect(result.transportes[0].vlIcms).toBe(360);
    });

    it('parseia registros D500 (comunicação)', () => {
      const result = parser.parse(SPED_SAMPLE);

      expect(result.comunicacoes).toHaveLength(1);
      expect(result.comunicacoes[0].vlDoc).toBe(800);
      expect(result.comunicacoes[0].vlIcms).toBe(96);
      expect(result.comunicacoes[0].vlPis).toBe(13.2);
      expect(result.comunicacoes[0].vlCofins).toBe(60.8);
    });

    it('calcula resumo corretamente', () => {
      const result = parser.parse(SPED_SAMPLE);

      expect(result.resumo.totalNotas).toBe(2);
      expect(result.resumo.totalItens).toBe(1);
      expect(result.resumo.valorTotalEntradas).toBe(15000);
      expect(result.resumo.valorTotalSaidas).toBe(25000);
      expect(result.resumo.icmsTotal).toBe(7110); // 2610 + 4500
      expect(result.resumo.cnpj).toBe('12345678000190');
      expect(result.resumo.razaoSocial).toBe('EMPRESA TESTE LTDA');
    });

    it('conta total de registros', () => {
      const result = parser.parse(SPED_SAMPLE);
      expect(result.totalRegistros).toBe(9);
    });
  });

  describe('conteúdo base64', () => {
    it('decodifica conteúdo base64', () => {
      const line = '|0000|017|0|01012025|31012025|TESTE BASE64||||||||||';
      const base64 = Buffer.from(line).toString('base64');
      const result = parser.parse(base64);

      expect(result.abertura).not.toBeNull();
      expect(result.abertura!.nome).toBe('TESTE BASE64');
    });
  });

  describe('tratamento de erros', () => {
    it('retorna erros sem quebrar o parsing', () => {
      const badContent = [
        '|0000|017|0|01012025|31012025|EMPRESA||||||||||',
        '||', // Linha inválida
        '|C100|0|0|F001|55|00|001|001||01012025|01012025|1000,00|0|0|0|1000,00|0|0|0|0|1000,00|180,00|0|0|0|16,50|76,00|0|0|',
      ].join('\n');

      const result = parser.parse(badContent);
      expect(result.abertura).not.toBeNull();
      expect(result.notasFiscais).toHaveLength(1);
    });

    it('lida com arquivo vazio', () => {
      const result = parser.parse('');
      expect(result.totalRegistros).toBe(0);
      expect(result.abertura).toBeNull();
      expect(result.notasFiscais).toHaveLength(0);
    });
  });
});
