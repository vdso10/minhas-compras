import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { notaJaImportada } from '@/db/repo';
import { buscarNota, ErroNota, extrairChave, pareceQrDeNota } from '@/lib/nfce';
import { notaPendente } from '@/store/notaPendente';
import { Botao, Cartao, estilos } from '@/ui/componentes';
import { IlustraCupom } from '@/ui/ilustracoes';
import { cores, espaco, fonte } from '@/ui/tema';

export default function TelaEscanear() {
  const db = useSQLiteContext();
  const [permissao, pedirPermissao] = useCameraPermissions();
  const [ativa, setAtiva] = useState(false);
  const [lendo, setLendo] = useState(false);
  const travado = useRef(false);

  // A câmera só fica ligada enquanto esta aba está aberta.
  useFocusEffect(
    useCallback(() => {
      travado.current = false;
      setAtiva(true);
      return () => setAtiva(false);
    }, []),
  );

  async function aoLer(conteudo: string) {
    if (travado.current) return;
    travado.current = true;

    const liberar = () => {
      travado.current = false;
    };

    if (!pareceQrDeNota(conteudo)) {
      Alert.alert('Não é uma nota fiscal', 'Aponte para o QR Code impresso no cupom fiscal (NFC-e).', [{ text: 'OK', onPress: liberar }]);
      return;
    }
    const chave = extrairChave(conteudo);
    if (chave && (await notaJaImportada(db, chave))) {
      Alert.alert('Nota já salva', 'Esta nota fiscal já foi importada antes.', [{ text: 'OK', onPress: liberar }]);
      return;
    }

    setLendo(true);
    try {
      const nota = await buscarNota(conteudo);
      notaPendente.definir(nota);
      router.push('/escanear/revisar');
    } catch (e) {
      const msg = e instanceof ErroNota ? e.message : 'Não conseguimos ler esta nota.';
      Alert.alert('Ops!', `${msg}\n\nVocê pode lançar a compra manualmente.`, [
        { text: 'Tentar de novo', onPress: liberar },
        { text: 'Lançar manualmente', onPress: () => router.push('/escanear/manual') },
      ]);
    } finally {
      setLendo(false);
    }
  }

  if (!permissao) return <View style={estilos.tela} />;

  if (!permissao.granted) {
    return (
      <View style={[estilos.tela, estilos.conteudo]}>
        <Stack.Screen options={{ title: 'Nota fiscal' }} />
        <View style={{ alignItems: 'center' }}>
          <IlustraCupom largura={200} />
        </View>
        <Cartao>
          <Text style={estilos.textoForte}>Leia o QR Code do cupom fiscal</Text>
          <Text style={estilos.texto}>
            Com uma foto do QR Code, o app salva o mercado, a data, os produtos e os preços automaticamente. Para isso,
            precisamos usar a câmera.
          </Text>
        </Cartao>
        <Botao titulo="Permitir câmera" icone="camera-outline" onPress={pedirPermissao} />
        <Botao titulo="Lançar compra sem nota" icone="pencil-outline" tipo="secundario" onPress={() => router.push('/escanear/manual')} />
      </View>
    );
  }

  return (
    <View style={estilos.tela}>
      <Stack.Screen options={{ title: 'Nota fiscal' }} />
      <View style={{ flex: 1 }}>
        {ativa && (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={lendo ? undefined : (r) => aoLer(r.data)}
          />
        )}
        <View pointerEvents="none" style={estilosCamera.moldura} />
        {lendo && (
          <View style={estilosCamera.carregando}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={estilosCamera.textoClaro}>Buscando a nota na SEFAZ…</Text>
          </View>
        )}
      </View>
      <View style={{ padding: espaco.g, gap: espaco.m, backgroundColor: cores.cartao }}>
        <Text style={[estilos.texto, { textAlign: 'center' }]}>Aponte a câmera para o QR Code do cupom fiscal.</Text>
        <Botao titulo="Lançar compra sem nota" icone="pencil-outline" tipo="secundario" onPress={() => router.push('/escanear/manual')} />
      </View>
    </View>
  );
}

const estilosCamera = StyleSheet.create({
  moldura: {
    position: 'absolute',
    alignSelf: 'center',
    top: '20%',
    width: 240,
    height: 240,
    borderWidth: 4,
    borderColor: '#fff',
    borderRadius: 24,
  },
  carregando: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.m,
  },
  textoClaro: { color: '#fff', fontSize: fonte.media },
});
