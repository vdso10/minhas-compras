/** Cores da marca: feira e cupom fiscal. */
export const paleta = {
  verde: '#1B7F4C',
  verdeEscuro: '#0F5132',
  verdeClaro: '#E3F3EA',
  folha: '#7BC47F',
  tomate: '#E8553D',
  banana: '#F6C343',
  papel: '#FFFDF7',
} as const;

export const cores = {
  primaria: paleta.verde,
  primariaClara: paleta.verdeClaro,
  fundo: '#F4F5F7',
  cartao: '#FFFFFF',
  campo: '#F4F5F7',
  texto: '#16181B',
  textoSecundario: '#5F6670',
  textoTerciario: '#8A9099',
  borda: '#DADDE1',
  divisoria: '#E8EAED',
  perigo: '#C62828',
  perigoClaro: '#FDECEC',
  sucesso: paleta.verde,
  alerta: '#B26A00',
} as const;

export const espaco = { p: 6, m: 12, g: 16, gg: 24 } as const;

export const fonte = { mini: 12, pequena: 13, normal: 15, media: 17, grande: 22, enorme: 30 } as const;

export const raio = { p: 8, m: 12, g: 16 } as const;
