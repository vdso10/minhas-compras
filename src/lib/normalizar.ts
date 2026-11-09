/** Remove acentos, deixa minúsculo e tira espaços extras. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.,/ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Primeira letra maiúscula, resto minúsculo: "ARROZ TIO JOAO" -> "Arroz tio joao". */
export function capitalizar(texto: string): string {
  const t = texto.trim().replace(/\s+/g, ' ').toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function palavras(texto: string): string[] {
  return normalizar(texto)
    .split(' ')
    .filter((p) => p.length >= 2);
}

/**
 * Nota de 0 a 1 de parecença entre dois nomes de produto.
 * Considera parecido quando as palavras do nome mais curto aparecem no mais longo
 * ("arroz" x "arroz tio joao 5kg" = 1).
 */
export function parecenca(a: string, b: string): number {
  const pa = palavras(a);
  const pb = palavras(b);
  if (pa.length === 0 || pb.length === 0) return 0;
  const [curto, longo] = pa.length <= pb.length ? [pa, new Set(pb)] : [pb, new Set(pa)];
  const iguais = curto.filter((p) => longo.has(p)).length;
  return iguais / curto.length;
}

/** Sugere o produto existente mais parecido (ou null se nenhum passar de 0,6). */
export function sugerirProduto<T extends { nome: string }>(nome: string, produtos: T[]): T | null {
  let melhor: T | null = null;
  let nota = 0;
  for (const p of produtos) {
    const n = parecenca(nome, p.nome);
    if (n > nota) {
      nota = n;
      melhor = p;
    }
  }
  return nota >= 0.6 ? melhor : null;
}
