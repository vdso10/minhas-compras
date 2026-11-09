import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Roda `carregar` sempre que a tela aparece (ex.: ao voltar de outra tela)
 * e também quando algum valor de `deps` muda com a tela aberta.
 */
export function useAoFocar(carregar: () => unknown, deps: unknown[]) {
  const ultimo = useRef(carregar);
  useEffect(() => {
    ultimo.current = carregar;
  });
  const chave = JSON.stringify(deps.map((d) => (typeof d === 'object' ? null : d)));
  useFocusEffect(
    useCallback(() => {
      void ultimo.current();
      // `chave` é proposital: recarrega quando os valores de `deps` mudam
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chave]),
  );
}
