import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';

import { criarMercado, listarMercados, type Mercado } from '@/db/repo';

import { BotaoCabecalho, BotaoIcone, estiloNoGrupo, estilos, Icone, IconeEmBolha, Secao } from './componentes';
import { cores, espaco } from './tema';

type Props = {
  visivel: boolean;
  onEscolher: (mercado: Mercado) => void;
  onFechar: () => void;
};

/** Janela para escolher um mercado da lista ou cadastrar um novo. */
export function EscolherMercado({ visivel, onEscolher, onFechar }: Props) {
  const db = useSQLiteContext();
  const [mercados, setMercados] = useState<Mercado[]>([]);
  const [novo, setNovo] = useState('');

  useEffect(() => {
    if (visivel) listarMercados(db).then(setMercados);
  }, [visivel, db]);

  async function cadastrar() {
    const nome = novo.trim();
    if (!nome) return;
    const id = await criarMercado(db, nome);
    setNovo('');
    onEscolher({ id, nome, cnpj: null });
  }

  return (
    <Modal visible={visivel} animationType="slide" onRequestClose={onFechar}>
      <View style={[estilos.tela, { paddingTop: espaco.gg * 2 }]}>
        <View style={[estilos.linha, { paddingHorizontal: espaco.g, justifyContent: 'space-between' }]}>
          <Text style={estilos.titulo}>Em qual mercado?</Text>
          <BotaoCabecalho icone="close" rotulo="Fechar" onPress={onFechar} />
        </View>
        <FlatList
          data={mercados}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={estilos.conteudoLista}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              <View style={estilos.linha}>
                <TextInput
                  placeholder="Novo mercado"
                  placeholderTextColor={cores.textoTerciario}
                  value={novo}
                  onChangeText={setNovo}
                  onSubmitEditing={cadastrar}
                  accessibilityLabel="Nome do novo mercado"
                  style={[estilos.campo, { flex: 1 }]}
                />
                <BotaoIcone icone="plus" rotulo="Cadastrar mercado" onPress={cadastrar} desativado={!novo.trim()} />
              </View>
              {mercados.length > 0 && <Secao titulo="Seus mercados" />}
            </View>
          }
          ListEmptyComponent={
            <Text style={[estilos.textoFraco, { textAlign: 'center', marginTop: espaco.g }]}>
              Digite o nome do mercado acima para cadastrar.
            </Text>
          }
          renderItem={({ item, index }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => onEscolher(item)}
              style={({ pressed }) => [estiloNoGrupo(index, mercados.length), pressed && { backgroundColor: cores.fundo }]}>
              <View style={estilos.linhaMenu}>
                <IconeEmBolha nome="storefront-outline" />
                <Text style={[estilos.textoForte, { flex: 1 }]} numberOfLines={1}>
                  {item.nome}
                </Text>
                <Icone nome="chevron-right" tamanho={22} cor={cores.textoTerciario} />
              </View>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}
