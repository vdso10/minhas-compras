import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { paleta } from './tema';

/**
 * Carrinho da marca, num quadro 100x100 (o mesmo desenho de scripts/gerar-icones.mjs).
 * Os itens ficam separados para a abertura animada poder "jogar" cada um dentro do carrinho.
 */
type Props = { tamanho: number; cor?: string };

export function CarrinhoVazio({ tamanho, cor = '#fff' }: Props) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 100 100">
      <Path d="M9 24 H19 L29.5 66 H75" fill="none" stroke={cor} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M23 40 H86 L79 62 H28.5 Z" fill={cor} stroke={cor} strokeWidth={4} strokeLinejoin="round" />
      <Path d="M26 47.5 H83 M27.5 55 H80.5" stroke={paleta.verde} strokeOpacity={0.35} strokeWidth={2.5} strokeLinecap="round" />
      <Circle cx={36} cy={77} r={6.5} fill={cor} />
      <Circle cx={70} cy={77} r={6.5} fill={cor} />
    </Svg>
  );
}

export function Maca({ tamanho }: Props) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 100 100">
      <Circle cx={44} cy={34} r={9.5} fill={paleta.tomate} />
      <Path d="M44 25 C46 19 52 18 55 20 C52 25 47 26 44 25 Z" fill={paleta.folha} />
    </Svg>
  );
}

export function Leite({ tamanho }: Props) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 100 100">
      <Rect x={57} y={17} width={15} height={25} rx={2} fill={paleta.papel} />
      <Path d="M57 18 L64.5 10 L72 18 Z" fill={paleta.papel} />
      <Rect x={57} y={25} width={15} height={6} fill={paleta.banana} />
    </Svg>
  );
}

export function Banana({ tamanho }: Props) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 100 100">
      <Path d="M74 28 C76 40 85 42 90 33 C85 36 79 34 77 27 Z" fill={paleta.banana} />
      <Path d="M74 28 L76 25.5" stroke={paleta.verdeEscuro} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** Logo completo (carrinho cheio), para usar parado. */
export function LogoCarrinho({ tamanho, fundo = true }: { tamanho: number; fundo?: boolean }) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 100 100">
      {fundo && <Rect width={100} height={100} rx={24} fill={paleta.verde} />}
      <G transform="translate(14 14) scale(0.72)">
        <Rect x={57} y={17} width={15} height={25} rx={2} fill={paleta.papel} />
        <Path d="M57 18 L64.5 10 L72 18 Z" fill={paleta.papel} />
        <Rect x={57} y={25} width={15} height={6} fill={paleta.banana} />
        <Circle cx={44} cy={34} r={9.5} fill={paleta.tomate} />
        <Path d="M44 25 C46 19 52 18 55 20 C52 25 47 26 44 25 Z" fill={paleta.folha} />
        <Path d="M9 24 H19 L29.5 66 H75" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M23 40 H86 L79 62 H28.5 Z" fill="#fff" stroke="#fff" strokeWidth={4} strokeLinejoin="round" />
        <Path d="M26 47.5 H83 M27.5 55 H80.5" stroke={paleta.verde} strokeOpacity={0.35} strokeWidth={2.5} strokeLinecap="round" />
        <Circle cx={36} cy={77} r={6.5} fill="#fff" />
        <Circle cx={70} cy={77} r={6.5} fill="#fff" />
      </G>
    </Svg>
  );
}

/** Borda serrilhada de cupom fiscal (largura livre, altura 10). */
export function BordaCupom({ largura, cor = paleta.papel, emCima = false }: { largura: number; cor?: string; emCima?: boolean }) {
  const dente = 10;
  const n = Math.ceil(largura / dente);
  let d = emCima ? `M0 10` : `M0 0`;
  for (let i = 0; i < n; i++) {
    const x = i * dente;
    d += emCima ? ` L${x + dente / 2} 0 L${x + dente} 10` : ` L${x + dente / 2} 10 L${x + dente} 0`;
  }
  d += emCima ? ` L${n * dente} 10 Z` : ` L${n * dente} 0 Z`;
  return (
    <Svg width={largura} height={10} viewBox={`0 0 ${largura} 10`} preserveAspectRatio="none">
      <Path d={d} fill={cor} />
    </Svg>
  );
}
