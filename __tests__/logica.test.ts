import { compararLista, compararProduto, type PrecoRegistrado } from '../src/lib/comparacao';
import { brParaISO, nomeMesCurto, ultimosMeses } from '../src/lib/datas';
import { gastosPorMes, variacao } from '../src/lib/gastos';
import { lerNumero } from '../src/lib/moeda';
import { normalizar, parecenca, sugerirProduto } from '../src/lib/normalizar';

describe('normalizar / parecença', () => {
  it('tira acentos e caixa', () => {
    expect(normalizar('  Café  PILÃO 500g ')).toBe('cafe pilao 500g');
  });
  it('acha o produto parecido', () => {
    expect(parecenca('Arroz', 'ARROZ TIO JOAO 5KG')).toBe(1);
    const produtos = [
      { id: 1, nome: 'Arroz' },
      { id: 2, nome: 'Feijão preto' },
    ];
    expect(sugerirProduto('FEIJAO PRETO CAMIL 1KG', produtos)?.id).toBe(2);
    expect(sugerirProduto('DETERGENTE YPE', produtos)).toBeNull();
  });
});

describe('lerNumero', () => {
  it.each([
    ['9,98', 9.98],
    ['R$ 1.234,56', 1234.56],
    ['2.0000', 2],
    ['10', 10],
    ['', null],
    ['abc', null],
  ])('%s -> %s', (texto, esperado) => {
    expect(lerNumero(texto)).toBe(esperado);
  });
});

describe('datas', () => {
  it('converte e lista meses', () => {
    expect(brParaISO('05/10/2026')).toBe('2026-10-05');
    expect(brParaISO('40/13/2026')).toBeNull();
    expect(nomeMesCurto('2026-11')).toBe('nov/26');
    expect(ultimosMeses(3, new Date(2026, 0, 15))).toEqual(['2025-11', '2025-12', '2026-01']);
  });
});

const precos: PrecoRegistrado[] = [
  { produto_id: 1, mercado_id: 10, mercado_nome: 'A', preco_unitario: 30, data: '2026-09-01' },
  { produto_id: 1, mercado_id: 10, mercado_nome: 'A', preco_unitario: 28, data: '2026-10-01' },
  { produto_id: 1, mercado_id: 20, mercado_nome: 'B', preco_unitario: 29, data: '2026-10-05' },
  { produto_id: 2, mercado_id: 20, mercado_nome: 'B', preco_unitario: 5, data: '2026-10-05' },
];

describe('comparação', () => {
  it('usa o último preço de cada mercado e marca o mais barato', () => {
    const r = compararProduto(precos.filter((p) => p.produto_id === 1));
    expect(r.map((l) => [l.mercado_nome, l.ultimoPreco, l.maisBarato])).toEqual([
      ['A', 28, true],
      ['B', 29, false],
    ]);
    expect(r[0].media).toBe(29);
  });

  it('soma a lista por mercado, priorizando quem tem mais itens', () => {
    const r = compararLista(
      [
        { produto_id: 1, quantidade: 2 },
        { produto_id: 2, quantidade: 1 },
      ],
      precos,
    );
    expect(r).toEqual([
      { mercado_id: 20, mercado_nome: 'B', total: 63, itensComPreco: 2, totalItens: 2 },
      { mercado_id: 10, mercado_nome: 'A', total: 56, itensComPreco: 1, totalItens: 2 },
    ]);
  });
});

describe('gastos', () => {
  it('agrupa por mês e calcula variação', () => {
    const meses = gastosPorMes(
      [
        { data: '2026-10-05', total: 100 },
        { data: '2026-10-20', total: 50 },
        { data: '2026-11-02', total: 120 },
        { data: '2025-01-01', total: 999 },
      ],
      3,
      new Date(2026, 10, 9),
    );
    expect(meses).toEqual([
      { mes: '2026-09', total: 0, compras: 0 },
      { mes: '2026-10', total: 150, compras: 2 },
      { mes: '2026-11', total: 120, compras: 1 },
    ]);
    expect(variacao(120, 150)).toEqual({ atual: 120, anterior: 150, diferenca: -30, percentual: -20, tendencia: 'caiu' });
    expect(variacao(50, 0).percentual).toBeNull();
  });
});
