import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { router, Stack } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';

import { exportarTudo, importarTudo, type Backup } from '@/db/repo';
import { hojeISO } from '@/lib/datas';
import { estilos, Grupo, LinhaMenu, Secao } from '@/ui/componentes';
import { LogoCarrinho } from '@/ui/marca';
import { cores, espaco } from '@/ui/tema';

export default function TelaMais() {
  const db = useSQLiteContext();
  const [ocupado, setOcupado] = useState(false);

  async function exportar() {
    setOcupado(true);
    try {
      const backup = await exportarTudo(db);
      const arquivo = new File(Paths.cache, `backup-compras-${hojeISO()}.json`);
      if (arquivo.exists) arquivo.delete();
      arquivo.create();
      await arquivo.write(JSON.stringify(backup));
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Indisponível', 'Este aparelho não permite compartilhar arquivos.');
        return;
      }
      await Sharing.shareAsync(arquivo.uri, { mimeType: 'application/json', dialogTitle: 'Salvar backup' });
    } catch (e) {
      Alert.alert('Erro ao criar backup', (e as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  async function importar() {
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/json', '*/*'], copyToCacheDirectory: true });
    if (r.canceled) return;
    Alert.alert('Restaurar backup', 'Isso vai SUBSTITUIR todos os dados atuais pelos do arquivo. Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Restaurar',
        style: 'destructive',
        onPress: async () => {
          setOcupado(true);
          try {
            const texto = await new File(r.assets[0].uri).text();
            await importarTudo(db, JSON.parse(texto) as Backup);
            Alert.alert('Pronto!', 'Seus dados foram restaurados.');
          } catch (e) {
            Alert.alert('Não foi possível restaurar', (e as Error).message);
          } finally {
            setOcupado(false);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudoLista}>
      <Stack.Screen options={{ title: 'Mais' }} />

      <View style={[estilos.linha, { paddingHorizontal: 4, paddingBottom: espaco.p }]}>
        <LogoCarrinho tamanho={52} />
        <View>
          <Text style={estilos.titulo}>Minhas Compras</Text>
          <Text style={estilos.textoFraco}>Versão {Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </View>
      </View>

      <Secao titulo="Dados" />
      <Grupo>
        <LinhaMenu
          icone="storefront-outline"
          titulo="Meus mercados"
          descricao="Renomear os mercados das suas compras"
          onPress={() => router.push('/mais/mercados')}
        />
        <LinhaMenu
          icone="cloud-upload-outline"
          titulo="Fazer backup"
          descricao="Salvar uma cópia no Drive, WhatsApp ou e-mail"
          onPress={ocupado ? undefined : exportar}
          direita={ocupado ? <ActivityIndicator color={cores.primaria} /> : undefined}
        />
        <LinhaMenu
          icone="cloud-download-outline"
          titulo="Restaurar backup"
          descricao="Substitui os dados atuais pelos do arquivo"
          onPress={ocupado ? undefined : importar}
        />
      </Grupo>
      <Text style={[estilos.textoFraco, { paddingHorizontal: 4, marginTop: espaco.p, color: cores.textoTerciario }]}>
        Seus dados ficam só neste celular. Faça um backup antes de trocar de aparelho.
      </Text>

      <Secao titulo="Sobre" />
      <Grupo>
        <LinhaMenu icone="shield-check-outline" titulo="Política de privacidade" onPress={() => router.push('/mais/privacidade')} />
      </Grupo>
    </ScrollView>
  );
}
