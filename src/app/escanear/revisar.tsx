import { router, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';

import {
  listarMercados,
  listarProdutos,
  obterOuCriarMercadoPorCnpj,
  obterOuCriarProduto,
  produtoPorApelido,
  registrarCompra,
  renomearMercado,
  salvarApelido,
} from '@/db/repo';
import { brParaISO, hojeISO, isoParaBR } from '@/lib/datas';
import { formatarReais } from '@/lib/moeda';
import { capitalizar, sugerirProduto } from '@/lib/normalizar';
import { notaPendente } from '@/store/notaPendente';
import { Botao, Campo, Cartao, estilos, Vazio } from '@/ui/componentes';
import { IlustraCupom } from '@/ui/ilustracoes';
import { espaco } from '@/ui/tema';

type ItemRevisao = { descricao: string; nome: string; quantidade: number; precoUnitario: number; precoTotal: number; unidade: string };

export default function TelaRevisar() {
  const db = useSQLiteContext();
  const nota = notaPendente.pegar();
  const [mercado, setMercado] = useState('');
  const [data, setData] = useState('');
  const [itens, setItens] = useState<ItemRevisao[]>([]);
  const [salvando, setSalvando] = useState(false);

  // Sugere nomes já usados antes, para o mesmo produto juntar o histórico de preços.
  useEffect(() => {
    if (!nota) return;
    (async () => {
      const mercados = await listarMercados(db);
      const conhecido = nota.cnpj ? mercados.find((m) => m.cnpj === nota.cnpj) : undefined;
      setMercado(conhecido?.nome ?? capitalizar(nota.mercadoNome));
      setData(isoParaBR(nota.data ?? hojeISO()));

      const produtos = await listarProdutos(db);
      const sugeridos: ItemRevisao[] = [];
      for (const i of nota.itens) {
        const porApelido = await produtoPorApelido(db, i.descricao);
        const parecido = porApelido ?? sugerirProduto(i.descricao, produtos);
        sugeridos.push({ ...i, nome: parecido?.nome ?? capitalizar(i.descricao) });
      }
      setItens(sugeridos);
    })();
  }, [db, nota]);

  if (!nota) {
    return (
      <View style={estilos.tela}>
        <Vazio ilustracao={<IlustraCupom />} texto="Nenhuma nota para revisar." />
      </View>
    );
  }

  const notaAtual = nota;

  async function salvar() {
    const dataISO = brParaISO(data);
    if (!dataISO) {
      Alert.alert('Data inválida', 'Use o formato dd/mm/aaaa.');
      return;
    }
    if (itens.some((i) => !i.nome.trim())) {
      Alert.alert('Falta nome', 'Preencha o nome de todos os produtos.');
      return;
    }
    setSalvando(true);
    try {
      await db.withTransactionAsync(async () => {
        const mercadoId = await obterOuCriarMercadoPorCnpj(db, mercado || notaAtual.mercadoNome, notaAtual.cnpj);
        if (mercado.trim()) await renomearMercado(db, mercadoId, mercado);
        const itensCompra = [];
        for (const i of itens) {
          const produtoId = await obterOuCriarProduto(db, i.nome, i.unidade);
          await salvarApelido(db, i.descricao, produtoId);
          itensCompra.push({ produtoId, quantidade: i.quantidade, precoUnitario: i.precoUnitario, precoTotal: i.precoTotal });
        }
        await registrarCompra(db, {
          mercadoId,
          data: dataISO,
          origem: 'nfce',
          chave: notaAtual.chave,
          itens: itensCompra,
          total: notaAtual.total,
        });
      });
      notaPendente.limpar();
      Alert.alert('Nota salva!', `${formatarReais(notaAtual.total)} em ${mercado}.`);
      router.back();
      router.navigate('/gastos');
    } catch (e) {
      const msg = String((e as Error).message).includes('UNIQUE') ? 'Esta nota já foi salva antes.' : (e as Error).message;
      Alert.alert('Não foi possível salvar', msg);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={estilos.tela}>
      <Stack.Screen options={{ title: 'Conferir nota' }} />
      <FlatList
        data={itens}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: espaco.m }}>
            <Cartao>
              <Text style={estilos.textoFraco}>Total da nota</Text>
              <Text style={estilos.titulo}>{formatarReais(notaAtual.total)}</Text>
              <Text style={estilos.textoFraco}>{itens.length} produtos</Text>
            </Cartao>
            <Campo rotulo="Mercado" value={mercado} onChangeText={setMercado} />
            <Campo rotulo="Data" value={data} onChangeText={setData} keyboardType="numbers-and-punctuation" />
            <Text style={estilos.textoFraco}>
              Confira os nomes. Use nomes simples (ex.: &quot;Arroz 5kg&quot;) para comparar o mesmo produto entre mercados. O
              app lembra sua escolha nas próximas notas.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Cartao>
            <Text style={estilos.textoFraco}>Na nota: {item.descricao}</Text>
            <Campo
              value={item.nome}
              onChangeText={(t) => setItens((atual) => atual.map((x, i) => (i === index ? { ...x, nome: t } : x)))}
            />
            <Text style={estilos.texto}>
              {String(item.quantidade).replace('.', ',')} {item.unidade} × {formatarReais(item.precoUnitario)} ={' '}
              <Text style={{ fontWeight: '700' }}>{formatarReais(item.precoTotal)}</Text>
            </Text>
          </Cartao>
        )}
        ListFooterComponent={
          <View style={{ gap: espaco.m, marginTop: espaco.m }}>
            <Botao titulo="Salvar compra" icone="content-save-outline" onPress={salvar} carregando={salvando} />
            <Botao titulo="Cancelar" tipo="secundario" onPress={() => router.back()} />
          </View>
        }
      />
    </View>
  );
}
