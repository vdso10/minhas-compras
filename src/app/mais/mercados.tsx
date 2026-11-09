import { Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, FlatList, View } from 'react-native';

import { listarMercados, renomearMercado, type Mercado } from '@/db/repo';
import { Botao, Campo, estilos, Vazio } from '@/ui/componentes';
import { IlustraEtiqueta } from '@/ui/ilustracoes';
import { useAoFocar } from '@/ui/useAoFocar';

/** Renomear mercados (o nome da nota costuma ser a razão social, longo demais). */
export default function TelaMercados() {
  const db = useSQLiteContext();
  const [mercados, setMercados] = useState<Mercado[]>([]);
  const [nomes, setNomes] = useState<Record<number, string>>({});

  useAoFocar(async () => {
    const ms = await listarMercados(db);
    setMercados(ms);
    setNomes(Object.fromEntries(ms.map((m) => [m.id, m.nome])));
  }, [db]);

  async function salvar() {
    for (const m of mercados) {
      const novo = nomes[m.id]?.trim();
      if (novo && novo !== m.nome) await renomearMercado(db, m.id, novo);
    }
    Alert.alert('Salvo!', 'Nomes dos mercados atualizados.');
  }

  return (
    <View style={estilos.tela}>
      <Stack.Screen options={{ title: 'Meus mercados' }} />
      <FlatList
        data={mercados}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Vazio ilustracao={<IlustraEtiqueta />} texto="Nenhum mercado ainda. Eles aparecem aqui quando você salva uma compra." />}
        renderItem={({ item }) => (
          <Campo
            rotulo={item.cnpj ? `CNPJ ${item.cnpj}` : undefined}
            value={nomes[item.id] ?? ''}
            onChangeText={(t) => setNomes((n) => ({ ...n, [item.id]: t }))}
          />
        )}
        ListFooterComponent={mercados.length > 0 ? <Botao titulo="Salvar nomes" onPress={salvar} /> : undefined}
      />
    </View>
  );
}
