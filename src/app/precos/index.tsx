import { router, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';

import { listarProdutosComPreco, type ProdutoComPreco } from '@/db/repo';
import { formatarReais } from '@/lib/moeda';
import { estiloNoGrupo, estilos, Icone, Vazio } from '@/ui/componentes';
import { IlustraEtiqueta } from '@/ui/ilustracoes';
import { cores, espaco, raio } from '@/ui/tema';
import { useAoFocar } from '@/ui/useAoFocar';

export default function TelaPrecos() {
  const db = useSQLiteContext();
  const [busca, setBusca] = useState('');
  const [produtos, setProdutos] = useState<ProdutoComPreco[]>([]);

  useAoFocar(() => listarProdutosComPreco(db, busca).then(setProdutos), [db, busca]);

  return (
    <View style={estilos.tela}>
      <Stack.Screen options={{ title: 'Preços' }} />
      <FlatList
        data={produtos}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={estilos.conteudoLista}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View
            style={[
              estilos.linha,
              { backgroundColor: cores.cartao, borderRadius: raio.m, paddingHorizontal: espaco.m, gap: espaco.p + 2, marginBottom: espaco.g },
            ]}>
            <Icone nome="magnify" tamanho={20} cor={cores.textoTerciario} />
            <TextInput
              placeholder="Buscar produto"
              placeholderTextColor={cores.textoTerciario}
              value={busca}
              onChangeText={setBusca}
              accessibilityLabel="Buscar produto"
              style={{ flex: 1, height: 46, fontSize: 16, color: cores.texto }}
            />
            {busca ? (
              <Pressable accessibilityLabel="Limpar busca" onPress={() => setBusca('')} hitSlop={10}>
                <Icone nome="close-circle" tamanho={18} cor={cores.textoTerciario} />
              </Pressable>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <Vazio
            ilustracao={<IlustraEtiqueta />}
            texto={
              busca
                ? 'Nenhum produto encontrado.'
                : 'Ainda não há preços salvos.\nLeia uma nota fiscal ou finalize uma lista com preços.'
            }
          />
        }
        renderItem={({ item, index }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/precos/[id]', params: { id: String(item.id) } })}
            style={({ pressed }) => [estiloNoGrupo(index, produtos.length), pressed && { backgroundColor: cores.fundo }]}>
            <View style={[estilos.linhaMenu, { minHeight: 54 }]}>
              <View style={{ flex: 1 }}>
                <Text style={estilos.textoForte} numberOfLines={1}>
                  {item.nome}
                </Text>
                <Text style={estilos.textoFraco}>
                  {item.registros} {item.registros === 1 ? 'preço anotado' : 'preços anotados'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[estilos.textoFraco, { fontSize: 11 }]}>a partir de</Text>
                <Text style={[estilos.textoForte, { color: cores.primaria, fontVariant: ['tabular-nums'] }]}>
                  {formatarReais(item.menor_preco)}
                </Text>
              </View>
              <Icone nome="chevron-right" tamanho={22} cor={cores.textoTerciario} />
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
