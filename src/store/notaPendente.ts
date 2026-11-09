import type { NotaFiscal } from '@/lib/nfce';

/** Guarda a nota lida pela câmera até a tela de revisão pegar. */
let nota: NotaFiscal | null = null;

export const notaPendente = {
  definir(n: NotaFiscal) {
    nota = n;
  },
  pegar(): NotaFiscal | null {
    return nota;
  },
  limpar() {
    nota = null;
  },
};
