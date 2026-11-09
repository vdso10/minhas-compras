/** "2026-11-09" a partir de um Date (horário local). */
export function hojeISO(data = new Date()): string {
  const a = data.getFullYear();
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const d = String(data.getDate()).padStart(2, '0');
  return `${a}-${m}-${d}`;
}

/** "09/11/2026" -> "2026-11-09"; devolve null se inválido. */
export function brParaISO(texto: string): string | null {
  const m = texto.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  const [, d, mes, a] = m;
  if (Number(mes) < 1 || Number(mes) > 12 || Number(d) < 1 || Number(d) > 31) return null;
  return `${a}-${mes}-${d}`;
}

/** "2026-11-09" -> "09/11/2026" */
export function isoParaBR(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "2026-11" -> "nov/26" */
export function nomeMesCurto(anoMes: string): string {
  const [a, m] = anoMes.split('-');
  return `${MESES[Number(m) - 1]}/${a.slice(2)}`;
}

/** Lista dos últimos `n` meses ("AAAA-MM"), do mais antigo para o atual. */
export function ultimosMeses(n: number, referencia = new Date()): string[] {
  const meses: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(referencia.getFullYear(), referencia.getMonth() - i, 1);
    meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return meses;
}
