export type PrecoRegistrado = {
  produto_id: number;
  mercado_id: number;
  mercado_nome: string;
  preco_unitario: number;
  data: string; // AAAA-MM-DD
};

export type PrecoPorMercado = {
  mercado_id: number;
  mercado_nome: string;
  ultimoPreco: number;
  ultimaData: string;
  media: number;
  vezes: number;
  maisBarato: boolean;
};

/** Último preço pago por mercado (mais recente vence). */
function ultimosPorMercado(precos: PrecoRegistrado[]): Map<number, PrecoRegistrado> {
  const mapa = new Map<number, PrecoRegistrado>();
  for (const p of precos) {
    const atual = mapa.get(p.mercado_id);
    if (!atual || p.data >= atual.data) mapa.set(p.mercado_id, p);
  }
  return mapa;
}

/** Preços de UM produto agrupados por mercado, do mais barato para o mais caro. */
export function compararProduto(precos: PrecoRegistrado[]): PrecoPorMercado[] {
  const ultimos = ultimosPorMercado(precos);
  const linhas: PrecoPorMercado[] = [...ultimos.values()].map((u) => {
    const doMercado = precos.filter((p) => p.mercado_id === u.mercado_id);
    const soma = doMercado.reduce((s, p) => s + p.preco_unitario, 0);
    return {
      mercado_id: u.mercado_id,
      mercado_nome: u.mercado_nome,
      ultimoPreco: u.preco_unitario,
      ultimaData: u.data,
      media: soma / doMercado.length,
      vezes: doMercado.length,
      maisBarato: false,
    };
  });
  linhas.sort((a, b) => a.ultimoPreco - b.ultimoPreco);
  if (linhas.length > 1) {
    const menor = linhas[0].ultimoPreco;
    linhas.forEach((l) => (l.maisBarato = l.ultimoPreco === menor));
  }
  return linhas;
}

export type ItemParaComparar = { produto_id: number; quantidade: number };

export type TotalPorMercado = {
  mercado_id: number;
  mercado_nome: string;
  total: number;
  itensComPreco: number;
  totalItens: number;
};

/**
 * Quanto a lista custaria em cada mercado, usando o último preço conhecido de cada item.
 * Ordem: mercados que têm preço de mais itens primeiro; empate -> menor total.
 */
export function compararLista(itens: ItemParaComparar[], precos: PrecoRegistrado[]): TotalPorMercado[] {
  const porProduto = new Map<number, PrecoRegistrado[]>();
  for (const p of precos) {
    const lista = porProduto.get(p.produto_id) ?? [];
    lista.push(p);
    porProduto.set(p.produto_id, lista);
  }

  const resultado = new Map<number, TotalPorMercado>();
  for (const item of itens) {
    const ultimos = ultimosPorMercado(porProduto.get(item.produto_id) ?? []);
    for (const u of ultimos.values()) {
      const r = resultado.get(u.mercado_id) ?? {
        mercado_id: u.mercado_id,
        mercado_nome: u.mercado_nome,
        total: 0,
        itensComPreco: 0,
        totalItens: itens.length,
      };
      r.total += u.preco_unitario * (item.quantidade || 1);
      r.itensComPreco += 1;
      resultado.set(u.mercado_id, r);
    }
  }

  return [...resultado.values()].sort(
    (a, b) => b.itensComPreco - a.itensComPreco || a.total - b.total,
  );
}
