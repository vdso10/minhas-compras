import { ultimosMeses } from './datas';

export type CompraResumo = { data: string; total: number };
export type GastoMes = { mes: string; total: number; compras: number };

/** Soma o total de compras de cada um dos últimos `n` meses (inclui meses zerados). */
export function gastosPorMes(compras: CompraResumo[], n = 6, referencia = new Date()): GastoMes[] {
  const meses = ultimosMeses(n, referencia);
  const mapa = new Map<string, GastoMes>(meses.map((m) => [m, { mes: m, total: 0, compras: 0 }]));
  for (const c of compras) {
    const g = mapa.get(c.data.slice(0, 7));
    if (g) {
      g.total += c.total;
      g.compras += 1;
    }
  }
  return meses.map((m) => mapa.get(m)!);
}

export type Variacao = {
  atual: number;
  anterior: number;
  diferenca: number;
  /** null quando o mês anterior foi zero (não dá para calcular %). */
  percentual: number | null;
  tendencia: 'subiu' | 'caiu' | 'igual';
};

export function variacao(atual: number, anterior: number): Variacao {
  const diferenca = atual - anterior;
  const percentual = anterior > 0 ? (diferenca / anterior) * 100 : null;
  const tendencia = Math.abs(diferenca) < 0.005 ? 'igual' : diferenca > 0 ? 'subiu' : 'caiu';
  return { atual, anterior, diferenca, percentual, tendencia };
}
