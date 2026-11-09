import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';

import { excluirCompra, itensDaCompra, obterCompra, type CompraLinha } from '@/db/repo';
import { isoParaBR } from '@/lib/datas';
import { formatarReais } from '@/lib/moeda';
import { Botao, Cartao, estiloNoGrupo, estilos } from '@/ui/componentes';
import { espaco } from '@/ui/tema';
import { useAoFocar } from '@/ui/useAoFocar';

type Item = Awaited<ReturnType<typeof itensDaCompra>>[number];

export default function TelaCompra() {
  const db = useSQLiteContext();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const [compra, setCompra] = useState<CompraLinha | null>(null);
  const [itens, setItens] = useState<Item[]>([]);

  useAoFocar(async () => {
    setCompra(await obterCompra(db, id));
    setItens(await itensDaCompra(db, id));
  }, [db, id]);

  function confirmarExclusao() {
    Alert.alert('Excluir compra', 'Esta compra e seus preços serão apagados.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await excluirCompra(db, id);
          router.back();
        },
      },
    ]);
  }

  return (
    <View style={estilos.tela}>
      <Stack.Screen options={{ title: compra?.mercado_nome ?? 'Compra' }} />
      <FlatList
        data={itens}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={estilos.conteudoLista}
        ListHeaderComponent={
          compra ? (
            <Cartao style={{ marginBottom: espaco.m }}>
              <Text style={estilos.textoFraco}>
                {isoParaBR(compra.data)} • {compra.origem === 'nfce' ? 'nota fiscal' : 'manual'}
              </Text>
              <Text style={estilos.titulo}>{formatarReais(compra.total)}</Text>
            </Cartao>
          ) : undefined
        }
        ListEmptyComponent={<Text style={estilos.textoFraco}>Compra salva só com o valor total.</Text>}
        renderItem={({ item, index }) => (
          <View style={[estiloNoGrupo(index, itens.length), estilos.linhaMenu, { minHeight: 52 }]}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.texto}>{item.nome}</Text>
              <Text style={estilos.textoFraco}>
                {String(item.quantidade).replace('.', ',')} × {formatarReais(item.preco_unitario)}
              </Text>
            </View>
            <Text style={estilos.textoForte}>{formatarReais(item.preco_total)}</Text>
          </View>
        )}
        ListFooterComponent={<Botao titulo="Excluir compra" icone="trash-can-outline" tipo="perigo" onPress={confirmarExclusao} style={{ marginTop: espaco.g }} />}
      />
    </View>
  );
}
