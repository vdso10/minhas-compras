const formatador = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatarReais(valor: number): string {
  return formatador.format(valor);
}

/**
 * Converte texto digitado ou vindo da nota em número.
 * Aceita "9,98", "R$ 1.234,56", "2.0000" (padrão da nota) e "10".
 */
export function lerNumero(texto: string | null | undefined): number | null {
  if (texto == null) return null;
  let t = String(texto).replace(/[^\d.,-]/g, '');
  if (!t) return null;
  if (t.includes(',')) {
    // padrão brasileiro: ponto = milhar, vírgula = decimal
    t = t.replace(/\./g, '').replace(',', '.');
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}
