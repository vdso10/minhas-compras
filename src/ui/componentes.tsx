import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { cores, espaco, fonte, raio } from './tema';

export type NomeIcone = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Icone({ nome, tamanho = 22, cor = cores.texto }: { nome: NomeIcone; tamanho?: number; cor?: string }) {
  return <MaterialCommunityIcons name={nome} size={tamanho} color={cor} />;
}

// ---------- Botões ----------

type BotaoProps = {
  titulo: string;
  onPress: () => void;
  /** primario = verde cheio; secundario = verde suave; perigo = vermelho suave */
  tipo?: 'primario' | 'secundario' | 'perigo';
  desativado?: boolean;
  carregando?: boolean;
  style?: StyleProp<ViewStyle>;
  icone?: NomeIcone;
};

const CORES_BOTAO = {
  primario: { fundo: cores.primaria, texto: '#fff' },
  secundario: { fundo: cores.primariaClara, texto: cores.primaria },
  perigo: { fundo: cores.perigoClaro, texto: cores.perigo },
} as const;

export function Botao({ titulo, onPress, tipo = 'primario', desativado, carregando, style, icone }: BotaoProps) {
  const bloqueado = desativado || carregando;
  const c = CORES_BOTAO[tipo];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: bloqueado }}
      onPress={onPress}
      disabled={bloqueado}
      style={({ pressed }) => [
        estilos.botao,
        { backgroundColor: c.fundo },
        pressed && { opacity: 0.8 },
        bloqueado && { opacity: 0.5 },
        style,
      ]}>
      {carregando ? (
        <ActivityIndicator color={c.texto} />
      ) : (
        <View style={[estilos.linha, { gap: espaco.p + 2 }]}>
          {icone && <Icone nome={icone} tamanho={20} cor={c.texto} />}
          <Text style={[estilos.botaoTexto, { color: c.texto }]}>{titulo}</Text>
        </View>
      )}
    </Pressable>
  );
}

/** Botão redondo só com ícone (ex.: adicionar). */
export function BotaoIcone({
  icone,
  onPress,
  rotulo,
  tipo = 'primario',
  tamanho = 46,
  desativado,
}: {
  icone: NomeIcone;
  onPress: () => void;
  rotulo: string;
  tipo?: 'primario' | 'secundario' | 'perigo';
  tamanho?: number;
  desativado?: boolean;
}) {
  const c = CORES_BOTAO[tipo];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      onPress={onPress}
      disabled={desativado}
      hitSlop={6}
      style={({ pressed }) => [
        {
          width: tamanho,
          height: tamanho,
          borderRadius: tamanho / 2,
          backgroundColor: c.fundo,
          alignItems: 'center',
          justifyContent: 'center',
        },
        pressed && { opacity: 0.8 },
        desativado && { opacity: 0.4 },
      ]}>
      <Icone nome={icone} tamanho={tamanho * 0.5} cor={c.texto} />
    </Pressable>
  );
}

/** Ícone sem fundo para o cabeçalho das telas. */
export function BotaoCabecalho({ icone, onPress, rotulo, cor = cores.texto }: { icone: NomeIcone; onPress: () => void; rotulo: string; cor?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={rotulo} onPress={onPress} hitSlop={10} style={{ padding: 4 }}>
      <Icone nome={icone} tamanho={24} cor={cor} />
    </Pressable>
  );
}

// ---------- Campos ----------

export function Campo({ rotulo, style, ...props }: TextInputProps & { rotulo?: string }) {
  return (
    <View style={{ gap: espaco.p }}>
      {rotulo ? <Text style={estilos.rotulo}>{rotulo}</Text> : null}
      <TextInput
        placeholderTextColor={cores.textoTerciario}
        style={[estilos.campo, style]}
        accessibilityLabel={rotulo ?? props.placeholder}
        {...props}
      />
    </View>
  );
}

// ---------- Blocos ----------

export function Cartao({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[estilos.cartao, style]}>{children}</View>;
}

export function Titulo({ children }: { children: ReactNode }) {
  return <Text style={estilos.titulo}>{children}</Text>;
}

/** Título pequeno que separa grupos de conteúdo. */
export function Secao({ titulo, direita }: { titulo: string; direita?: ReactNode }) {
  return (
    <View style={[estilos.linha, { justifyContent: 'space-between', marginTop: espaco.g, marginBottom: espaco.p, paddingHorizontal: 4 }]}>
      <Text style={estilos.secao}>{titulo}</Text>
      {direita}
    </View>
  );
}

/**
 * Estilo de uma linha dentro de um grupo (bloco branco único com divisórias).
 * Use em FlatList: `style={estiloNoGrupo(index, total)}`.
 */
export function estiloNoGrupo(indice: number, total: number): StyleProp<ViewStyle> {
  return [
    estilos.linhaGrupo,
    indice === 0 && { borderTopLeftRadius: raio.m, borderTopRightRadius: raio.m },
    indice === total - 1 && { borderBottomLeftRadius: raio.m, borderBottomRightRadius: raio.m, borderBottomWidth: 0 },
  ];
}

/** Bloco branco com as linhas separadas por divisórias finas. */
export function Grupo({ children }: { children: ReactNode }) {
  const itens = (Array.isArray(children) ? children : [children]).filter(Boolean);
  return (
    <View style={estilos.grupo}>
      {itens.map((filho, i) => (
        <View key={i} style={i < itens.length - 1 && estilos.divisoria}>
          {filho}
        </View>
      ))}
    </View>
  );
}

/** Linha de menu: ícone, título, descrição e seta. */
export function LinhaMenu({
  icone,
  titulo,
  descricao,
  onPress,
  direita,
  corIcone = cores.primaria,
  fundoIcone = cores.primariaClara,
}: {
  icone: NomeIcone;
  titulo: string;
  descricao?: string;
  onPress?: () => void;
  direita?: ReactNode;
  corIcone?: string;
  fundoIcone?: string;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [estilos.linhaMenu, pressed && { backgroundColor: cores.fundo }]}>
      <IconeEmBolha nome={icone} cor={corIcone} fundo={fundoIcone} />
      <View style={{ flex: 1 }}>
        <Text style={estilos.textoForte} numberOfLines={1}>
          {titulo}
        </Text>
        {descricao ? (
          <Text style={estilos.textoFraco} numberOfLines={2}>
            {descricao}
          </Text>
        ) : null}
      </View>
      {direita}
      {onPress && <Icone nome="chevron-right" tamanho={22} cor={cores.textoTerciario} />}
    </Pressable>
  );
}

export function IconeEmBolha({ nome, cor = cores.primaria, fundo = cores.primariaClara, tamanho = 36 }: { nome: NomeIcone; cor?: string; fundo?: string; tamanho?: number }) {
  return (
    <View style={{ width: tamanho, height: tamanho, borderRadius: raio.p + 2, backgroundColor: fundo, alignItems: 'center', justifyContent: 'center' }}>
      <Icone nome={nome} tamanho={tamanho * 0.55} cor={cor} />
    </View>
  );
}

export function BarraProgresso({ valor }: { valor: number }) {
  const pct = Math.max(0, Math.min(1, valor));
  return (
    <View style={{ height: 4, borderRadius: 2, backgroundColor: cores.divisoria, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: cores.primaria }} />
    </View>
  );
}

export function Vazio({ texto, ilustracao }: { texto: string; ilustracao?: ReactNode }) {
  return (
    <View style={estilos.vazio}>
      {ilustracao}
      <Text style={estilos.vazioTexto}>{texto}</Text>
    </View>
  );
}

export const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.g, gap: espaco.m, paddingBottom: 110 },
  conteudoLista: { padding: espaco.g, paddingBottom: 110 },
  botao: {
    minHeight: 48,
    borderRadius: raio.m,
    paddingHorizontal: espaco.g,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoTexto: { fontSize: 16, fontWeight: '600' },
  rotulo: { fontSize: fonte.pequena, color: cores.textoSecundario, fontWeight: '600' },
  campo: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.m - 2,
    paddingHorizontal: espaco.m,
    fontSize: 16,
    color: cores.texto,
    backgroundColor: cores.cartao,
  },
  cartao: {
    backgroundColor: cores.cartao,
    borderRadius: raio.m,
    padding: espaco.g - 2,
    gap: espaco.p,
  },
  grupo: { backgroundColor: cores.cartao, borderRadius: raio.m, overflow: 'hidden' },
  linhaGrupo: {
    backgroundColor: cores.cartao,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: cores.divisoria,
  },
  divisoria: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: cores.divisoria },
  linhaMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.m,
    paddingHorizontal: espaco.m + 2,
    paddingVertical: espaco.m - 2,
    minHeight: 58,
  },
  titulo: { fontSize: fonte.grande, fontWeight: '700', color: cores.texto, letterSpacing: -0.3 },
  secao: { fontSize: fonte.pequena, fontWeight: '600', color: cores.textoSecundario },
  texto: { fontSize: fonte.normal, color: cores.texto },
  textoForte: { fontSize: fonte.normal, color: cores.texto, fontWeight: '600' },
  textoFraco: { fontSize: fonte.pequena, color: cores.textoSecundario },
  valor: { fontSize: fonte.media, color: cores.texto, fontWeight: '700', fontVariant: ['tabular-nums'] },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.m },
  vazio: { padding: espaco.gg, alignItems: 'center', gap: espaco.m },
  vazioTexto: { fontSize: fonte.normal, color: cores.textoSecundario, textAlign: 'center', lineHeight: 22 },
});
