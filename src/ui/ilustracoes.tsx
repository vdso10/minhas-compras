import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { paleta } from './tema';

/** Ilustrações leves (vetor) para telas vazias. Quadro 160x120. */
type Props = { largura?: number };

const LINHA = '#C9D6CE';

function Base({ largura = 180, children }: Props & { children: React.ReactNode }) {
  return (
    <Svg width={largura} height={(largura * 120) / 160} viewBox="0 0 160 120">
      <Circle cx={80} cy={64} r={52} fill={paleta.verdeClaro} />
      {children}
    </Svg>
  );
}

/** Prancheta com itens marcados e uma maçã. */
export function IlustraLista(p: Props) {
  return (
    <Base {...p}>
      <Rect x={50} y={22} width={60} height={80} rx={8} fill="#fff" stroke={paleta.verde} strokeWidth={3} />
      <Rect x={66} y={16} width={28} height={12} rx={4} fill={paleta.verde} />
      {[42, 58, 74].map((y, i) => (
        <G key={y}>
          <Rect x={59} y={y - 5} width={10} height={10} rx={2.5} fill={i === 0 ? paleta.verde : '#fff'} stroke={paleta.verde} strokeWidth={2} />
          {i === 0 && <Path d={`M61.5 ${y} l2.5 2.5 l4 -5`} stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" />}
          <Rect x={74} y={y - 2} width={i === 1 ? 20 : 26} height={4} rx={2} fill={LINHA} />
        </G>
      ))}
      <Circle cx={112} cy={92} r={11} fill={paleta.tomate} />
      <Path d="M112 81 C114 75 120 74 123 76 C120 81 115 82 112 81 Z" fill={paleta.folha} />
    </Base>
  );
}

/** Cupom fiscal com QR Code. */
export function IlustraCupom(p: Props) {
  // borda de baixo serrilhada, da direita para a esquerda
  const dentes = Array.from({ length: 7 }, (_, i) => {
    const x = 112 - i * 8;
    return `L${x - 4} 110 L${x - 8} 104`;
  }).join(' ');
  return (
    <Base {...p}>
      <Path d={`M56 14 H112 V104 ${dentes} Z`} fill={paleta.papel} stroke={LINHA} strokeWidth={1.5} strokeLinejoin="round" />
      <Rect x={64} y={24} width={40} height={4} rx={2} fill={paleta.verde} />
      <Rect x={64} y={34} width={30} height={3} rx={1.5} fill={LINHA} />
      <Rect x={64} y={42} width={36} height={3} rx={1.5} fill={LINHA} />
      <Rect x={64} y={50} width={26} height={3} rx={1.5} fill={LINHA} />
      <G transform="translate(70 62)">
        <Rect width={28} height={28} rx={3} fill="#fff" stroke={paleta.verdeEscuro} strokeWidth={2} />
        <Rect x={4} y={4} width={8} height={8} fill={paleta.verdeEscuro} />
        <Rect x={16} y={4} width={8} height={8} fill={paleta.verdeEscuro} />
        <Rect x={4} y={16} width={8} height={8} fill={paleta.verdeEscuro} />
        <Rect x={16} y={16} width={4} height={4} fill={paleta.verdeEscuro} />
        <Rect x={20} y={20} width={4} height={4} fill={paleta.verdeEscuro} />
      </G>
    </Base>
  );
}

/** Barras de gasto mensal com uma moeda. */
export function IlustraGrafico(p: Props) {
  const barras = [34, 52, 28, 64];
  return (
    <Base {...p}>
      <Path d="M38 100 H122" stroke={paleta.verdeEscuro} strokeWidth={3} strokeLinecap="round" />
      {barras.map((h, i) => (
        <Rect key={i} x={46 + i * 19} y={98 - h} width={13} height={h} rx={4} fill={i === 3 ? paleta.verde : '#A9D6BD'} />
      ))}
      <Circle cx={50} cy={38} r={12} fill={paleta.banana} stroke="#E0A800" strokeWidth={2} />
      <SvgText x={50} y={42.5} fontSize={12} fontWeight="bold" fill="#8A6500" textAnchor="middle">
        R$
      </SvgText>
    </Base>
  );
}

/** Etiqueta de preço. */
export function IlustraEtiqueta(p: Props) {
  return (
    <Base {...p}>
      <G transform="rotate(-18 80 64)">
        <Path d="M48 44 L96 44 L118 64 L96 84 L48 84 Q42 84 42 78 L42 50 Q42 44 48 44 Z" fill={paleta.banana} />
        <Circle cx={103} cy={64} r={4.5} fill={paleta.verdeClaro} />
        <SvgText x={70} y={71} fontSize={20} fontWeight="bold" fill={paleta.verdeEscuro} textAnchor="middle">
          R$
        </SvgText>
      </G>
      <Path d="M108 50 C122 40 128 28 124 18" stroke={paleta.verdeEscuro} strokeWidth={2} fill="none" strokeLinecap="round" />
    </Base>
  );
}
