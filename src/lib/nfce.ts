import { brParaISO } from './datas';
import { arredondar, lerNumero } from './moeda';

export type ItemNota = {
  descricao: string;
  quantidade: number;
  unidade: string;
  precoUnitario: number;
  precoTotal: number;
};

export type NotaFiscal = {
  chave: string | null;
  mercadoNome: string;
  cnpj: string | null;
  data: string | null; // AAAA-MM-DD
  total: number;
  itens: ItemNota[];
};

export class ErroNota extends Error {}

/** Confere se o texto do QR Code parece uma consulta de NFC-e. */
export function pareceQrDeNota(conteudo: string): boolean {
  return /^https?:\/\//i.test(conteudo) && /nfc|sped|sefaz|fazenda/i.test(conteudo);
}

/** Chave de acesso (44 dígitos) do QR Code: vem no parâmetro "p" ou "chNFe". */
export function extrairChave(conteudo: string): string | null {
  const p = conteudo.match(/[?&](?:p|chNFe)=(\d{44})/i);
  if (p) return p[1];
  const solto = conteudo.replace(/\s/g, '').match(/\d{44}/);
  return solto ? solto[0] : null;
}

// ---------- Leitura simples de HTML (sem biblioteca: mais leve e compatível com o Hermes) ----------

const ENTIDADES: Record<string, string> = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú',
  atilde: 'ã', otilde: 'õ', Atilde: 'Ã', Otilde: 'Õ',
  acirc: 'â', ecirc: 'ê', ocirc: 'ô', Acirc: 'Â', Ecirc: 'Ê', Ocirc: 'Ô',
  agrave: 'à', Agrave: 'À', ccedil: 'ç', Ccedil: 'Ç', ordm: 'º', ordf: 'ª',
};

function decodificar(texto: string): string {
  return texto.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (inteiro, e: string) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCharCode(n) : inteiro;
    }
    return ENTIDADES[e] ?? inteiro;
  });
}

/** Tira as tags e devolve o texto limpo. */
function texto(html: string | null | undefined): string {
  if (!html) return '';
  return decodificar(html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

/** Conteúdo de todas as tags `tag` (ex.: "tr", "td"). Não trata tags iguais aninhadas. */
function todas(html: string, tag: string): string[] {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
  return Array.from(html.matchAll(re), (m) => m[1]);
}

/** Conteúdo da primeira tag que tem a classe `classe` (ou o id, se `porId`). */
function primeiraCom(html: string, classe: string, porId = false): string | null {
  const atributo = porId ? 'id' : 'class';
  const re = new RegExp(
    `<([a-z0-9]+)\\b[^>]*\\b${atributo}\\s*=\\s*["'](?:[^"']*\\s)?${classe}(?:\\s[^"']*)?["'][^>]*>([\\s\\S]*?)</\\1>`,
    'i',
  );
  const m = html.match(re);
  return m ? m[2] : null;
}

function primeiraTag(html: string, tags: string[]): string | null {
  for (const tag of tags) {
    const achou = todas(html, tag)[0];
    if (achou !== undefined && texto(achou)) return achou;
  }
  return null;
}

/** Pega o número logo depois de um rótulo, ex.: "Qtde.:2,000" -> 2. */
function numeroDepois(t: string, rotulo: RegExp): number | null {
  const m = t.match(new RegExp(rotulo.source + String.raw`\s*:?\s*(?:R\$)?\s*([\d.,]+)`, 'i'));
  return m ? lerNumero(m[1]) : null;
}

/** Layout padrão (usado pela maioria das SEFAZ): spans txtTit / Rqtd / RUN / RvlUnit / valor. */
function itensLayoutPadrao(html: string): ItemNota[] {
  return todas(html, 'tr')
    .filter((tr) => primeiraCom(tr, 'txtTit') !== null)
    .map((tr) => {
      const descricao = texto(primeiraCom(tr, 'txtTit'));
      const quantidade = numeroDepois(texto(primeiraCom(tr, 'Rqtd')), /Qtde\.?/) ?? 1;
      const unidade = texto(primeiraCom(tr, 'RUN')).replace(/^UN\s*:\s*/i, '') || 'UN';
      const total = lerNumero(texto(primeiraCom(tr, 'valor'))) ?? 0;
      const unit =
        numeroDepois(texto(primeiraCom(tr, 'RvlUnit')), /Vl\.?\s*Unit\.?/) ?? (quantidade ? total / quantidade : total);
      return { descricao, quantidade, unidade, precoUnitario: arredondar(unit), precoTotal: total };
    })
    .filter((i) => i.descricao);
}

/** Layout em tabela (portal de MG): "Qtde total de ítens: 2.0000" / "UN: KG" / "Valor total R$: R$ 9,98". */
function itensLayoutTabela(html: string): ItemNota[] {
  return todas(html, 'tr')
    .map((tr) => ({ tr, t: texto(tr) }))
    .filter(({ t }) => /Qtde\s+total\s+de\s+[íi]tens\s*:/i.test(t) && /Valor\s+total/i.test(t))
    .map(({ tr, t }) => {
      const primeira = todas(tr, 'td')[0] ?? '';
      const nome = primeiraTag(primeira, ['h7', 'b', 'strong', 'span']) ?? primeira;
      const descricao = texto(nome).replace(/\(C[óo]digo:.*?\)/i, '').trim();
      const quantidade = numeroDepois(t, /Qtde\s+total\s+de\s+[íi]tens/) ?? 1;
      const un = t.match(/UN\s*:\s*([A-Za-z]+)/);
      const total = numeroDepois(t, /Valor\s+total\s+R\$/) ?? 0;
      return {
        descricao,
        quantidade,
        unidade: un ? un[1].toUpperCase() : 'UN',
        precoUnitario: arredondar(quantidade ? total / quantidade : total),
        precoTotal: total,
      };
    })
    .filter((i) => i.descricao);
}

function nomeDoMercado(html: string): string {
  const candidatos = [primeiraCom(html, 'u20', true), primeiraCom(html, 'txtTopo'), primeiraTag(html, ['h4'])];
  for (const c of candidatos) {
    const t = texto(c);
    if (t) return t;
  }
  return 'Mercado';
}

function totalDaNota(t: string): number | null {
  return (
    numeroDepois(t, /Valor\s+a\s+pagar\s+R\$/) ??
    numeroDepois(t, /Valor\s+total\s+R\$(?!\s*:\s*R\$)/) ??
    null
  );
}

/** Lê a página HTML da consulta da NFC-e e devolve mercado, data, itens e total. */
export function lerNotaHtml(html: string, urlOuChave = ''): NotaFiscal {
  let itens = itensLayoutPadrao(html);
  if (itens.length === 0) itens = itensLayoutTabela(html);
  if (itens.length === 0) {
    throw new ErroNota('Não encontramos os produtos nesta nota.');
  }

  const t = texto(html);
  const cnpj = t.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
  const emissao = t.match(/Emiss[ãa]o\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i) ?? t.match(/(\d{2}\/\d{2}\/\d{4})/);
  const somaItens = arredondar(itens.reduce((s, i) => s + i.precoTotal, 0));

  return {
    chave: extrairChave(urlOuChave) ?? extrairChave(t.replace(/\s/g, '')),
    mercadoNome: nomeDoMercado(html),
    cnpj: cnpj ? cnpj[0] : null,
    data: emissao ? brParaISO(emissao[1]) : null,
    total: totalDaNota(t) ?? somaItens,
    itens,
  };
}

/**
 * Endereços para tentar, em ordem: primeiro a versão segura (https),
 * depois o endereço original do QR Code (alguns estados ainda imprimem http).
 */
export function enderecosParaTentar(urlQr: string): string[] {
  const url = urlQr.trim();
  const seguro = url.replace(/^http:\/\//i, 'https://');
  return seguro === url ? [url] : [seguro, url];
}

/** Baixa a página da SEFAZ pelo link do QR Code e lê a nota. */
export async function buscarNota(urlQr: string): Promise<NotaFiscal> {
  let resposta: Response | null = null;
  for (const url of enderecosParaTentar(urlQr)) {
    try {
      resposta = await fetch(url, { headers: { Accept: 'text/html' } });
      if (resposta.ok) break;
    } catch {
      resposta = null;
    }
  }
  if (!resposta) {
    throw new ErroNota('Sem conexão com a internet. Tente de novo.');
  }
  if (!resposta.ok) {
    throw new ErroNota(`O site da SEFAZ respondeu com erro (${resposta.status}). Tente mais tarde.`);
  }
  return lerNotaHtml(await resposta.text(), urlQr);
}
