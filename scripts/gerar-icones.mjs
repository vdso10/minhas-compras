// Gera os ícones do app a partir do desenho do carrinho (mesmo desenho de src/ui/marca.tsx).
// Uso: node scripts/gerar-icones.mjs
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const VERDE = '#1B7F4C';
const VERDE_ESCURO = '#0F5132';
const TOMATE = '#E8553D';
const BANANA = '#F6C343';
const PAPEL = '#FFFDF7';
const FOLHA = '#7BC47F';

// Carrinho num quadro 100x100. `cor` = cor do carrinho, `faixa` = cor das listras da cesta.
function carrinho({ cor = '#fff', faixa = VERDE, itens = true, mono = false } = {}) {
  const apple = mono ? cor : TOMATE;
  const leite = mono ? cor : PAPEL;
  const rotulo = mono ? cor : BANANA;
  const folha = mono ? cor : FOLHA;
  const itensSvg = itens
    ? `
    <g>
      <rect x="57" y="17" width="15" height="25" rx="2" fill="${leite}"/>
      <path d="M57 18 L64.5 10 L72 18 Z" fill="${leite}"/>
      <rect x="57" y="25" width="15" height="6" fill="${rotulo}"/>
      <circle cx="44" cy="34" r="9.5" fill="${apple}"/>
      <path d="M44 25 C46 19 52 18 55 20 C52 25 47 26 44 25 Z" fill="${folha}"/>
    </g>`
    : '';
  return `
    ${itensSvg}
    <path d="M9 24 H19 L29.5 66 H75" fill="none" stroke="${cor}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M23 40 H86 L79 62 H28.5 Z" fill="${cor}" stroke="${cor}" stroke-width="4" stroke-linejoin="round"/>
    ${mono ? '' : `<path d="M26 47.5 H83 M27.5 55 H80.5" stroke="${faixa}" stroke-opacity="0.35" stroke-width="2.5" stroke-linecap="round"/>`}
    <circle cx="36" cy="77" r="6.5" fill="${cor}"/>
    <circle cx="70" cy="77" r="6.5" fill="${cor}"/>`;
}

// Coloca o carrinho centralizado ocupando `escala` do quadro.
function envolver({ tamanho, fundo, escala, conteudo, cantos = 0 }) {
  const lado = tamanho * escala;
  const desloc = (tamanho - lado) / 2;
  const fundoSvg = fundo
    ? `<defs><clipPath id="c"><rect width="${tamanho}" height="${tamanho}" rx="${cantos}"/></clipPath></defs>
       <g clip-path="url(#c)">
         <rect width="${tamanho}" height="${tamanho}" fill="${fundo}"/>
         <circle cx="${tamanho * 0.85}" cy="${tamanho * 0.12}" r="${tamanho * 0.32}" fill="${VERDE_ESCURO}" fill-opacity="0.35"/>
       </g>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho}" viewBox="0 0 ${tamanho} ${tamanho}">
    ${fundoSvg}
    <g transform="translate(${desloc} ${desloc + lado * 0.02}) scale(${lado / 100})">${conteudo}</g>
  </svg>`;
}

function salvar(nome, svg) {
  const png = new Resvg(svg).render().asPng();
  writeFileSync(join('assets', 'images', nome), png);
  console.log('ok', nome, `${(png.length / 1024).toFixed(1)} KB`);
}

// Ícone principal (Play Store / iOS): fundo verde, carrinho com itens.
salvar('icon.png', envolver({ tamanho: 1024, fundo: VERDE, escala: 0.72, conteudo: carrinho() }));
// Android adaptativo: frente transparente (zona segura ~66%), fundo liso.
salvar('android-icon-foreground.png', envolver({ tamanho: 1024, escala: 0.56, conteudo: carrinho() }));
salvar(
  'android-icon-background.png',
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${VERDE}"/>
   <circle cx="870" cy="120" r="330" fill="${VERDE_ESCURO}" fill-opacity="0.35"/></svg>`,
);
salvar('android-icon-monochrome.png', envolver({ tamanho: 1024, escala: 0.56, conteudo: carrinho({ mono: true }) }));
// Abertura nativa: carrinho vazio branco (a animação enche ele depois).
salvar('splash-icon.png', envolver({ tamanho: 512, escala: 1, conteudo: carrinho({ itens: false }) }));
salvar('favicon.png', envolver({ tamanho: 64, fundo: VERDE, escala: 0.8, conteudo: carrinho(), cantos: 14 }));
// ---------- Play Store ----------
function salvarEm(caminho, svg) {
  const png = new Resvg(svg, { font: { loadSystemFonts: true } }).render().asPng();
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, png);
  console.log('ok', caminho, `${(png.length / 1024).toFixed(1)} KB`);
}

// Ícone da loja: 512x512, sem transparência (o Google arredonda os cantos).
const icone512 = envolver({ tamanho: 512, fundo: VERDE, escala: 0.72, conteudo: carrinho() });
salvarEm('docs/play-store/icone-512.png', icone512);
salvarEm('docs/icone.png', icone512);

// Gráfico de destaque: 1024x500. Carrinho à esquerda, nome num cupom à direita.
const dentesCupom = (x, y, largura, emCima) => {
  let d = `M${x} ${y}`;
  for (let i = 0; i < largura / 16; i++) {
    const xi = x + i * 16;
    d += emCima ? ` L${xi + 8} ${y - 12} L${xi + 16} ${y}` : ` L${xi + 8} ${y + 12} L${xi + 16} ${y}`;
  }
  return d + ' Z';
};
const destaque = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <rect width="1024" height="500" fill="${VERDE}"/>
  <circle cx="930" cy="40" r="260" fill="${VERDE_ESCURO}" fill-opacity="0.35"/>
  <circle cx="80" cy="480" r="160" fill="${VERDE_ESCURO}" fill-opacity="0.25"/>
  <g transform="translate(70 70) scale(3.6)">${carrinho()}</g>
  <path d="${dentesCupom(480, 130, 464, true)}" fill="${PAPEL}"/>
  <rect x="480" y="130" width="464" height="230" fill="${PAPEL}"/>
  <path d="${dentesCupom(480, 360, 464, false)}" fill="${PAPEL}"/>
  <text x="712" y="215" font-family="Segoe UI, Roboto, Arial" font-size="52" font-weight="800" fill="${VERDE_ESCURO}" text-anchor="middle">Minhas Compras</text>
  <line x1="516" y1="248" x2="908" y2="248" stroke="#C9C4B5" stroke-width="3" stroke-dasharray="10 8"/>
  <text x="712" y="295" font-family="Segoe UI, Roboto, Arial" font-size="28" fill="#5F5B50" text-anchor="middle">Lista, nota fiscal e gastos do mês</text>
  <text x="712" y="335" font-family="Segoe UI, Roboto, Arial" font-size="22" fill="#8A857A" text-anchor="middle">Tudo no seu celular, sem cadastro</text>
</svg>`;
salvarEm('docs/play-store/grafico-destaque.png', destaque);

// Prévia para conferir o visual
salvar('../../scripts/previa-icone.png', envolver({ tamanho: 256, fundo: VERDE, escala: 0.72, conteudo: carrinho(), cantos: 56 }));
