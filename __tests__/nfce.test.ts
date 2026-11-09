import { readFileSync } from 'fs';
import { join } from 'path';

import { enderecosParaTentar, ErroNota, extrairChave, lerNotaHtml, pareceQrDeNota } from '../src/lib/nfce';

const fixture = (nome: string) => readFileSync(join(__dirname, 'fixtures', nome), 'utf8');
const CHAVE = '31261012345678000190650010000012341000012345';
const URL_MG = `https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml?p=${CHAVE}|2|1|1|ABCDEF`;

describe('QR Code', () => {
  it('reconhece link de NFC-e e extrai a chave', () => {
    expect(pareceQrDeNota(URL_MG)).toBe(true);
    expect(pareceQrDeNota('https://exemplo.com')).toBe(false);
    expect(extrairChave(URL_MG)).toBe(CHAVE);
  });

  it('tenta https antes do http impresso no QR', () => {
    expect(enderecosParaTentar('http://nfce.fazenda.mg.gov.br/x?p=1')).toEqual([
      'https://nfce.fazenda.mg.gov.br/x?p=1',
      'http://nfce.fazenda.mg.gov.br/x?p=1',
    ]);
    expect(enderecosParaTentar(URL_MG)).toEqual([URL_MG]);
  });
});

describe('lerNotaHtml - layout padrão', () => {
  const nota = lerNotaHtml(fixture('nota-padrao.html'), URL_MG);

  it('lê mercado, CNPJ, data e total pago', () => {
    expect(nota.mercadoNome).toBe('SUPERMERCADO BOM PRECO LTDA');
    expect(nota.cnpj).toBe('12.345.678/0001-90');
    expect(nota.data).toBe('2026-10-05');
    expect(nota.total).toBe(62);
    expect(nota.chave).toBe(CHAVE);
  });

  it('lê os itens', () => {
    expect(nota.itens).toEqual([
      { descricao: 'ARROZ TIO JOAO 5KG', quantidade: 2, unidade: 'UN', precoUnitario: 27.9, precoTotal: 55.8 },
      { descricao: 'BANANA PRATA KG', quantidade: 1.235, unidade: 'KG', precoUnitario: 5.99, precoTotal: 7.4 },
    ]);
  });
});

describe('lerNotaHtml - layout tabela (MG)', () => {
  const nota = lerNotaHtml(fixture('nota-mg-tabela.html'), URL_MG);

  it('lê mercado, CNPJ, data e total', () => {
    expect(nota.mercadoNome).toBe('SUPERMERCADOS MINEIROS S/A');
    expect(nota.cnpj).toBe('98.765.432/0001-10');
    expect(nota.data).toBe('2026-11-02');
    expect(nota.total).toBe(36.46);
  });

  it('lê os itens e calcula o preço unitário', () => {
    expect(nota.itens).toEqual([
      { descricao: 'LEITE UHT INTEGRAL 1L', quantidade: 3, unidade: 'UN', precoUnitario: 4.99, precoTotal: 14.97 },
      { descricao: 'CAFE PILAO 500G', quantidade: 1, unidade: 'PCT', precoUnitario: 21.49, precoTotal: 21.49 },
    ]);
  });
});

it('avisa quando a página não tem produtos', () => {
  expect(() => lerNotaHtml('<html><body>Erro</body></html>')).toThrow(ErroNota);
});
