import { router, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';

import { criarLista, excluirLista, listarListas, type ListaResumo } from '@/db/repo';
import { BarraProgresso, BotaoIcone, estiloNoGrupo, estilos, Icone, IconeEmBolha, Secao, Vazio } from '@/ui/componentes';
import { IlustraLista } from '@/ui/ilustracoes';
import { LogoCarrinho } from '@/ui/marca';
import { cores, espaco } from '@/ui/tema';
import { useAoFocar } from '@/ui/useAoFocar';

export default function TelaListas() {
  const db = useSQLiteContext();
  const [listas, setListas] = useState<ListaResumo[]>([]);
  const [nome, setNome] = useState('');

  const carregar = () => listarListas(db).then(setListas);
  useAoFocar(carregar, [db]);

  async function criar() {
    const id = await criarLista(db, nome || 'Compras do mês');
    setNome('');
    router.push({ pathname: '/lista/[id]', params: { id: String(id) } });
  }

  function confirmarExclusao(lista: ListaResumo) {
    Alert.alert('Excluir lista', `Excluir a lista "${lista.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await excluirLista(db, lista.id);
          carregar();
        },
      },
    ]);
  }

  return (
    <View style={estilos.tela}>
      <Stack.Screen
        options={{
          title: 'Minhas Compras',
          headerLeft: () => (
            <View style={{ marginRight: espaco.m }}>
              <LogoCarrinho tamanho={30} />
            </View>
          ),
        }}
      />
      <FlatList
        data={listas}
        keyExtractor={(l) => String(l.id)}
        contentContainerStyle={estilos.conteudoLista}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View style={estilos.linha}>
              <TextInput
                placeholder="Nova lista (ex.: Compras do mês)"
                placeholderTextColor={cores.textoTerciario}
                value={nome}
                onChangeText={setNome}
                onSubmitEditing={criar}
                returnKeyType="done"
                accessibilityLabel="Nome da nova lista"
                style={[estilos.campo, { flex: 1 }]}
              />
              <BotaoIcone icone="plus" rotulo="Criar lista" onPress={criar} />
            </View>
            {listas.length > 0 && <Secao titulo="Suas listas" />}
          </View>
        }
        ListEmptyComponent={<Vazio ilustracao={<IlustraLista />} texto={'Você ainda não tem listas.\nCrie a primeira acima.'} />}
        renderItem={({ item, index }) => {
          const progresso = item.total_itens ? item.comprados / item.total_itens : 0;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityHint="Toque para abrir. Segure para excluir."
              onPress={() => router.push({ pathname: '/lista/[id]', params: { id: String(item.id) } })}
              onLongPress={() => confirmarExclusao(item)}
              style={({ pressed }) => [estiloNoGrupo(index, listas.length), pressed && { backgroundColor: cores.fundo }]}>
              <View style={[estilos.linhaMenu, { alignItems: 'center' }]}>
                <IconeEmBolha nome={progresso === 1 ? 'cart-check' : 'cart-outline'} />
                <View style={{ flex: 1, gap: 5 }}>
                  <View style={[estilos.linha, { justifyContent: 'space-between' }]}>
                    <Text style={[estilos.textoForte, { flex: 1 }]} numberOfLines={1}>
                      {item.nome}
                    </Text>
                    <Text style={estilos.textoFraco}>
                      {item.total_itens === 0 ? 'vazia' : `${item.comprados}/${item.total_itens}`}
                    </Text>
                  </View>
                  {item.total_itens > 0 && <BarraProgresso valor={progresso} />}
                </View>
                <Icone nome="chevron-right" tamanho={22} cor={cores.textoTerciario} />
              </View>
            </Pressable>
          );
        }}
        ListFooterComponent={
          listas.length > 0 ? (
            <Text style={[estilos.textoFraco, { textAlign: 'center', marginTop: espaco.g, color: cores.textoTerciario }]}>
              Segure uma lista para excluir.
            </Text>
          ) : undefined
        }
      />
    </View>
  );
}
