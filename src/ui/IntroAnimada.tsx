import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { Banana, BordaCupom, CarrinhoVazio, Leite, Maca } from './marca';
import { paleta } from './tema';

/** Mesmo tamanho do carrinho da abertura nativa (app.json -> expo-splash-screen.imageWidth). */
const TAM = 150;
const LARGURA_CUPOM = 250;

/**
 * Abertura: o carrinho vazio da tela nativa recebe maçã, leite e banana,
 * sobe um pouco e o nome do app sai impresso num cupom. Toque para pular.
 */
export function IntroAnimada() {
  const [visivel, setVisivel] = useState(true);
  // valores criados uma vez só (useState com função inicial)
  const [quedas] = useState(() => [new Animated.Value(-TAM), new Animated.Value(-TAM), new Animated.Value(-TAM)]);
  const [opacItens] = useState(() => new Animated.Value(0));
  const [balanco] = useState(() => new Animated.Value(0));
  const [subida] = useState(() => new Animated.Value(0));
  const [cupom] = useState(() => new Animated.Value(0));
  const [fundo] = useState(() => new Animated.Value(1));
  const animacao = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    let cancelado = false;

    const sair = Animated.timing(fundo, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });

    AccessibilityInfo.isReduceMotionEnabled().then((reduzir) => {
      if (cancelado) return;
      if (reduzir) {
        quedas.forEach((q) => q.setValue(0));
        opacItens.setValue(1);
        subida.setValue(1);
        cupom.setValue(1);
        animacao.current = Animated.sequence([Animated.delay(700), sair]);
      } else {
        const cair = (v: Animated.Value) =>
          Animated.spring(v, { toValue: 0, speed: 16, bounciness: 9, useNativeDriver: true });
        animacao.current = Animated.sequence([
          Animated.delay(120),
          Animated.parallel([
            Animated.timing(opacItens, { toValue: 1, duration: 120, useNativeDriver: true }),
            Animated.stagger(150, quedas.map(cair)),
          ]),
          // o carrinho "sente" o peso
          Animated.sequence([
            Animated.timing(balanco, { toValue: 1, duration: 90, useNativeDriver: true }),
            Animated.spring(balanco, { toValue: 0, speed: 20, bounciness: 12, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.spring(subida, { toValue: 1, speed: 12, bounciness: 4, useNativeDriver: true }),
            Animated.timing(cupom, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
          Animated.delay(650),
          sair,
        ]);
      }
      animacao.current.start(() => setVisivel(false));
    });

    return () => {
      cancelado = true;
      animacao.current?.stop();
    };
  }, [quedas, opacItens, balanco, subida, cupom, fundo]);

  function pular() {
    animacao.current?.stop();
    Animated.timing(fundo, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setVisivel(false));
  }

  if (!visivel) return null;

  const itens = [Maca, Leite, Banana];
  const subir = subida.interpolate({ inputRange: [0, 1], outputRange: [0, -70] });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, estilos.fundo, { opacity: fundo }]}
      onLayout={() => SplashScreen.hideAsync().catch(() => {})}
      accessibilityLabel="Minhas Compras, abrindo">
      <Pressable style={estilos.centro} onPress={pular} accessibilityRole="button" accessibilityHint="Toque para pular a abertura">
        <Animated.View style={{ width: TAM, height: TAM, transform: [{ translateY: subir }] }}>
          {itens.map((Item, i) => (
            <Animated.View
              key={i}
              style={[StyleSheet.absoluteFill, { opacity: opacItens, transform: [{ translateY: quedas[i] }] }]}>
              <Item tamanho={TAM} />
            </Animated.View>
          ))}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { transform: [{ translateY: balanco.interpolate({ inputRange: [0, 1], outputRange: [0, 5] }) }] },
            ]}>
            <CarrinhoVazio tamanho={TAM} />
          </Animated.View>

          <Animated.View
            style={[
              estilos.cupom,
              {
                opacity: cupom,
                transform: [{ translateY: cupom.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
              },
            ]}>
            <BordaCupom largura={LARGURA_CUPOM} emCima />
            <View style={estilos.cupomCorpo}>
              <Text style={estilos.nome} numberOfLines={1} adjustsFontSizeToFit>
                Minhas Compras
              </Text>
              <View style={estilos.tracejado} />
              <Text style={estilos.legenda}>lista, nota e gastos do mês</Text>
            </View>
            <BordaCupom largura={LARGURA_CUPOM} />
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  fundo: { backgroundColor: paleta.verde, zIndex: 100, elevation: 100 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cupom: {
    position: 'absolute',
    top: TAM + 8,
    left: (TAM - LARGURA_CUPOM) / 2,
    width: LARGURA_CUPOM,
  },
  cupomCorpo: { backgroundColor: paleta.papel, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', gap: 8 },
  nome: { fontSize: 24, fontWeight: '800', color: paleta.verdeEscuro, letterSpacing: -0.5 },
  tracejado: {
    alignSelf: 'stretch',
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C9C4B5',
  },
  legenda: { fontSize: 15, color: '#6B675C' },
});
