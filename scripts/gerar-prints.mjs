// Monta as capturas de tela da Play Store (1080x1920, proporção 9:16) a partir dos prints do celular.
// Uso: node scripts/gerar-prints.mjs
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';

const ORIGEM = 'docs/play-store/prints-originais';
const DESTINO = 'docs/play-store/prints';
const L = 1080;
const A = 1920;

// [arquivo original, título, subtítulo, altura útil do print (opcional, corta faixas no fim)]
const PRINTS = [
  ['1.png', 'Onde sua lista sai mais barata', 'Compare o total entre os mercados', 680],
  ['3.png', 'Leia o QR Code do cupom fiscal', 'Produtos e preços salvos automaticamente'],
  ['8.png', 'Veja quanto você gastou no mês', 'E compare com os meses anteriores'],
  ['6.png', 'Todos os preços que você pagou', 'Busque qualquer produto'],
  ['7.png', 'Preço de cada produto por mercado', 'Saiba onde comprar mais barato'],
  ['5.png', 'Sem nota? Lance a compra à mão', 'Só o total ou produto por produto'],
];

const tamanhoPng = (buf) => ({ w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) });
const escapar = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

PRINTS.forEach(([arquivo, titulo, subtitulo, alturaUtil], i) => {
  const png = readFileSync(`${ORIGEM}/${arquivo}`);
  const { w, h } = tamanhoPng(png);
  // corta a borda do emulador (cantos e moldura escura à direita/embaixo)
  const corte = { x: 4, y: 4, w: Math.min(w, 378) - 8, h: (alturaUtil ?? Math.min(h, 790)) - 14 };
  // fonte do título encolhe se o texto for longo
  const fonteTitulo = Math.min(62, Math.floor(1700 / titulo.length));
  const alturaFinal = 1440;
  const escala = alturaFinal / corte.h;
  const larguraFinal = corte.w * escala;
  const x = (L - larguraFinal) / 2;
  const y = 380;
  const raio = 44;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${L}" height="${A}" viewBox="0 0 ${L} ${A}">
    <defs>
      <clipPath id="tela"><rect x="${x}" y="${y}" width="${larguraFinal}" height="${alturaFinal}" rx="${raio}"/></clipPath>
      <filter id="sombra" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000" flood-opacity="0.28"/>
      </filter>
    </defs>
    <rect width="${L}" height="${A}" fill="#1B7F4C"/>
    <circle cx="${L - 60}" cy="80" r="380" fill="#0F5132" fill-opacity="0.35"/>
    <circle cx="40" cy="${A - 60}" r="300" fill="#0F5132" fill-opacity="0.25"/>
    <text x="${L / 2}" y="170" font-family="Segoe UI, Roboto, Arial" font-size="${fonteTitulo}" font-weight="800" fill="#FFFFFF" text-anchor="middle">${escapar(titulo)}</text>
    <text x="${L / 2}" y="250" font-family="Segoe UI, Roboto, Arial" font-size="40" fill="#E3F3EA" text-anchor="middle">${escapar(subtitulo)}</text>
    <rect x="${x}" y="${y}" width="${larguraFinal}" height="${alturaFinal}" rx="${raio}" fill="#fff" filter="url(#sombra)"/>
    <g clip-path="url(#tela)">
      <svg x="${x}" y="${y}" width="${larguraFinal}" height="${alturaFinal}" viewBox="${corte.x} ${corte.y} ${corte.w} ${corte.h}" preserveAspectRatio="none">
        <image width="${w}" height="${h}" xlink:href="data:image/png;base64,${png.toString('base64')}"/>
      </svg>
    </g>
  </svg>`;

  const saida = new Resvg(svg, { font: { loadSystemFonts: true } }).render().asPng();
  const nome = `${DESTINO}/${String(i + 1).padStart(2, '0')}.png`;
  writeFileSync(nome, saida);
  console.log('ok', nome, `${(saida.length / 1024).toFixed(0)} KB`);
});
