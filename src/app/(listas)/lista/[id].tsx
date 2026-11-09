import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useState } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  adicionarItem,
  atualizarItem,
  excluirLista,
  finalizarCompraDaLista,
  itensDaLista,
  obterLista,
  precosDosProdutos,
  removerItem,
  type ItemLista,
} from '@/db/repo';
import { compararLista, compararProduto, type PrecoRegistrado, type TotalPorMercado } from '@/lib/comparacao';
import { hojeISO } from '@/lib/datas';
import { arredondar, formatarReais, lerNumero } from '@/lib/moeda';
import {
  Botao,
  BotaoCabecalho,
  BotaoIcone,
  estiloNoGrupo,
  estilos,
  Icone,
  IconeEmBolha,
  Secao,
  Vazio,
} from '@/ui/componentes';
import { EscolherMercado } from '@/ui/EscolherMercado';
import { IlustraLista } from '@/ui/ilustracoes';
import { cores, espaco, fonte, raio } from '@/ui/tema';
import { useAoFocar } from '@/ui/useAoFocar';

const formatarQtd = (q: number) => String(q).replace('.', ',');

export default function TelaLista() {
  const db = useSQLiteContext();
  const listaId = Number(useLocalSearchParams<{ id: string }>().id);
  const [nomeLista, setNomeLista] = useState('Lista');
  const [itens, setItens] = useState<ItemLista[]>([]);
  const [precos, setPrecos] = useState<PrecoRegistrado[]>([]);
  const [novoItem, setNovoItem] = useState('');
  const [qtd, setQtd] = useState('1');
  const [escolhendoMercado, setEscolhendoMercado] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const lista = await obterLista(db, listaId);
    if (lista) setNomeLista(lista.nome);
    const its = await itensDaLista(db, listaId);
    setItens(its);
    setPrecos(await precosDosProdutos(db, its.map((i) => i.produto_id)));
  }
  useAoFocar(carregar, [db, listaId]);

  const ranking = useMemo(
    () => compararLista(itens.map((i) => ({ produto_id: i.produto_id, quantidade: i.quantidade })), precos),
    [itens, precos],
  );
  const aComprar = itens.filter((i) => !i.comprado);
  const noCarrinho = itens.filter((i) => i.comprado);
  const comPreco = noCarrinho.filter((i) => i.preco != null);
  const totalCarrinho = arredondar(comPreco.reduce((s, i) => s + (i.preco ?? 0) * i.quantidade, 0));

  const secoes = [
    { titulo: `A comprar (${aComprar.length})`, data: aComprar },
    { titulo: `No carrinho (${noCarrinho.length})`, data: noCarrinho },
  ].filter((s) => s.data.length > 0);

  async function adicionar() {
    if (!novoItem.trim()) return;
    await adicionarItem(db, listaId, novoItem, lerNumero(qtd) || 1);
    setNovoItem('');
    setQtd('1');
    carregar();
  }

  async function alternar(item: ItemLista) {
    await atualizarItem(db, item.id, { comprado: !item.comprado });
    carregar();
  }

  async function salvarPreco(item: ItemLista, texto: string) {
    const preco = lerNumero(texto);
    if (preco === item.preco) return;
    // digitar o preço já coloca o item no carrinho
    await atualizarItem(db, item.id, { preco, comprado: preco != null ? true : !!item.comprado });
    carregar();
  }

  function opcoesDoItem(item: ItemLista) {
    Alert.alert(item.nome, 'Remover este item da lista?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          await removerItem(db, item.id);
          carregar();
        },
      },
    ]);
  }

  async function finalizar(mercadoId: number, mercadoNome: string) {
    setEscolhendoMercado(false);
    setSalvando(true);
    try {
      await finalizarCompraDaLista(db, listaId, mercadoId, hojeISO());
      Alert.alert('Compra salva', `${formatarReais(totalCarrinho)} em ${mercadoNome}.\nA lista foi desmarcada para a próxima vez.`);
      carregar();
    } catch (e) {
      Alert.alert('Não foi possível salvar', (e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao() {
    Alert.alert('Excluir lista', `Excluir "${nomeLista}"? Os gastos já salvos continuam.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await excluirLista(db, listaId);
          router.back();
        },
      },
    ]);
  }

  return (
    <View style={estilos.tela}>
      <Stack.Screen
        options={{
          title: nomeLista,
          headerRight: () => <BotaoCabecalho icone="trash-can-outline" rotulo="Excluir lista" onPress={confirmarExclusao} />,
        }}
      />
      <SectionList
        sections={secoes}
        // a chave inclui o preço para o campo recarregar quando o preço mudar no banco
        keyExtractor={(i) => `${i.id}:${i.preco ?? ''}`}
        contentContainerStyle={estilos.conteudoLista}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={{ gap: espaco.m }}>
            <View style={estilos.linha}>
              <TextInput
                placeholder="Adicionar item"
                placeholderTextColor={cores.textoTerciario}
                value={novoItem}
                onChangeText={setNovoItem}
                onSubmitEditing={adicionar}
                returnKeyType="done"
                accessibilityLabel="Nome do item"
                style={[estilos.campo, { flex: 1 }]}
              />
              <TextInput
                value={qtd}
                onChangeText={setQtd}
                keyboardType="decimal-pad"
                accessibilityLabel="Quantidade"
                selectTextOnFocus
                style={[estilos.campo, { width: 52, textAlign: 'center', paddingHorizontal: 4 }]}
              />
              <BotaoIcone icone="plus" rotulo="Adicionar item" onPress={adicionar} desativado={!novoItem.trim()} />
            </View>
            {ranking.length > 0 && <MaisBarato ranking={ranking} />}
          </View>
        }
        renderSectionHeader={({ section }) => <Secao titulo={section.titulo} />}
        renderItem={({ item, index, section }) => (
          <LinhaItem
            item={item}
            estilo={estiloNoGrupo(index, section.data.length)}
            dica={dicaMaisBarato(item.produto_id, precos)}
            onAlternar={() => alternar(item)}
            onPreco={(t) => salvarPreco(item, t)}
            onOpcoes={() => opcoesDoItem(item)}
          />
        )}
        ListEmptyComponent={<Vazio ilustracao={<IlustraLista />} texto="Adicione os itens que você precisa comprar." />}
        ListFooterComponent={
          itens.length > 0 ? (
            <Text style={[estilos.textoFraco, { textAlign: 'center', marginTop: espaco.g, color: cores.textoTerciario }]}>
              Digite o preço ao pegar o item. Segure um item para removê-lo.
            </Text>
          ) : undefined
        }
      />

      {comPreco.length > 0 && (
        <View style={estilosLista.rodape}>
          <View style={{ flex: 1 }}>
            <Text style={estilos.textoFraco}>
              {comPreco.length} {comPreco.length === 1 ? 'item' : 'itens'} no carrinho
            </Text>
            <Text style={[estilos.valor, { fontSize: fonte.grande }]}>{formatarReais(totalCarrinho)}</Text>
          </View>
          <Botao titulo="Finalizar" icone="cart-check" onPress={() => setEscolhendoMercado(true)} carregando={salvando} />
        </View>
      )}

      <EscolherMercado
        visivel={escolhendoMercado}
        onFechar={() => setEscolhendoMercado(false)}
        onEscolher={(m) => finalizar(m.id, m.nome)}
      />
    </View>
  );
}

function dicaMaisBarato(produtoId: number, precos: PrecoRegistrado[]): string | null {
  const linhas = compararProduto(precos.filter((p) => p.produto_id === produtoId));
  if (linhas.length === 0) return null;
  const m = linhas[0];
  return `${linhas.length > 1 ? 'Melhor' : 'Último'}: ${formatarReais(m.ultimoPreco)} no ${m.mercado_nome}`;
}

function MaisBarato({ ranking }: { ranking: TotalPorMercado[] }) {
  const [melhor, ...outros] = ranking;
  return (
    <View style={estilosLista.ranking}>
      <View style={estilos.linha}>
        <IconeEmBolha nome="trophy-outline" fundo="#fff" />
        <View style={{ flex: 1 }}>
          <Text style={estilos.textoFraco}>Mercado mais barato para esta lista</Text>
          <Text style={estilos.textoForte} numberOfLines={1}>
            {melhor.mercado_nome}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[estilos.valor, { color: cores.primaria }]}>{formatarReais(melhor.total)}</Text>
          <Text style={[estilos.textoFraco, { fontSize: fonte.mini }]}>
            {melhor.itensComPreco}/{melhor.totalItens} itens
          </Text>
        </View>
      </View>
      {outros.slice(0, 2).map((r) => (
        <View key={r.mercado_id} style={[estilos.linha, { paddingLeft: 48 }]}>
          <Text style={[estilos.textoFraco, { flex: 1 }]} numberOfLines={1}>
            {r.mercado_nome}
          </Text>
          <Text style={estilos.textoFraco}>
            {formatarReais(r.total)} · {r.itensComPreco}/{r.totalItens}
          </Text>
        </View>
      ))}
    </View>
  );
}

type LinhaProps = {
  item: ItemLista;
  estilo: ReturnType<typeof estiloNoGrupo>;
  dica: string | null;
  onAlternar: () => void;
  onPreco: (texto: string) => void;
  onOpcoes: () => void;
};

function LinhaItem({ item, estilo, dica, onAlternar, onPreco, onOpcoes }: LinhaProps) {
  const [preco, setPreco] = useState(item.preco != null ? item.preco.toFixed(2).replace('.', ',') : '');
  const marcado = !!item.comprado;
  const detalhe = [item.quantidade !== 1 ? `${formatarQtd(item.quantidade)} un` : null, dica].filter(Boolean).join(' · ');

  return (
    <Pressable onLongPress={onOpcoes} delayLongPress={350} style={[estilo, estilosLista.item]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: marcado }}
        accessibilityLabel={`${marcado ? 'Desmarcar' : 'Marcar'} ${item.nome}`}
        onPress={onAlternar}
        hitSlop={10}
        style={[estilosLista.marcador, marcado && estilosLista.marcadorAtivo]}>
        {marcado && <Icone nome="check" tamanho={16} cor="#fff" />}
      </Pressable>

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={[estilosLista.nome, marcado && { color: cores.textoTerciario, textDecorationLine: 'line-through' }]}>
          {item.nome}
        </Text>
        {detalhe ? (
          <Text numberOfLines={1} style={estilosLista.detalhe}>
            {detalhe}
          </Text>
        ) : null}
      </View>

      <View style={estilosLista.preco}>
        <Text style={estilosLista.cifrao}>R$</Text>
        <TextInput
          accessibilityLabel={`Preço de ${item.nome}`}
          placeholder="0,00"
          placeholderTextColor={cores.textoTerciario}
          keyboardType="decimal-pad"
          value={preco}
          onChangeText={setPreco}
          onEndEditing={() => onPreco(preco)}
          selectTextOnFocus
          style={estilosLista.precoCampo}
        />
      </View>
    </Pressable>
  );
}

const estilosLista = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.m,
    paddingLeft: espaco.m + 2,
    paddingRight: espaco.p + 2,
    minHeight: 56,
    paddingVertical: espaco.p,
  },
  marcador: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: cores.borda,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcadorAtivo: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  nome: { fontSize: fonte.normal, fontWeight: '500', color: cores.texto },
  detalhe: { fontSize: fonte.mini, color: cores.textoSecundario, marginTop: 1 },
  preco: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cores.campo,
    borderRadius: raio.p,
    paddingLeft: espaco.p + 2,
    height: 36,
    width: 92,
  },
  cifrao: { fontSize: fonte.mini, color: cores.textoTerciario, fontWeight: '600' },
  precoCampo: {
    flex: 1,
    height: 36,
    paddingVertical: 0,
    paddingHorizontal: espaco.p,
    textAlign: 'right',
    fontSize: fonte.normal,
    fontWeight: '600',
    color: cores.texto,
    fontVariant: ['tabular-nums'],
  },
  ranking: {
    backgroundColor: cores.primariaClara,
    borderRadius: raio.m,
    padding: espaco.m,
    gap: espaco.p,
  },
  rodape: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.m,
    paddingHorizontal: espaco.g,
    paddingVertical: espaco.m,
    backgroundColor: cores.cartao,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: cores.borda,
  },
});
