import { router, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { obterOuCriarProduto, registrarCompra, type Mercado } from '@/db/repo';
import { brParaISO, hojeISO, isoParaBR } from '@/lib/datas';
import { arredondar, formatarReais, lerNumero } from '@/lib/moeda';
import { Botao, Campo, Cartao, estilos } from '@/ui/componentes';
import { EscolherMercado } from '@/ui/EscolherMercado';
import { cores, espaco } from '@/ui/tema';

type Linha = { nome: string; qtd: string; preco: string };

/** Lançar uma compra sem nota fiscal: só o total, ou também os produtos. */
export default function TelaManual() {
  const db = useSQLiteContext();
  const [mercado, setMercado] = useState<Mercado | null>(null);
  const [escolhendo, setEscolhendo] = useState(false);
  const [data, setData] = useState(isoParaBR(hojeISO()));
  const [total, setTotal] = useState('');
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [salvando, setSalvando] = useState(false);

  const itensValidos = linhas
    .map((l) => ({ nome: l.nome.trim(), qtd: lerNumero(l.qtd) || 1, preco: lerNumero(l.preco) }))
    .filter((l) => l.nome && l.preco != null);
  const somaItens = arredondar(itensValidos.reduce((s, l) => s + l.preco! * l.qtd, 0));
  const totalFinal = lerNumero(total) ?? somaItens;

  const mudar = (i: number, campo: keyof Linha, valor: string) =>
    setLinhas((atual) => atual.map((l, j) => (j === i ? { ...l, [campo]: valor } : l)));

  async function salvar() {
    const dataISO = brParaISO(data);
    if (!mercado) return Alert.alert('Escolha o mercado');
    if (!dataISO) return Alert.alert('Data inválida', 'Use o formato dd/mm/aaaa.');
    if (!totalFinal) return Alert.alert('Informe o valor', 'Digite o total ou os preços dos produtos.');

    setSalvando(true);
    try {
      await db.withTransactionAsync(async () => {
        const itens = [];
        for (const l of itensValidos) {
          const produtoId = await obterOuCriarProduto(db, l.nome);
          itens.push({ produtoId, quantidade: l.qtd, precoUnitario: l.preco!, precoTotal: arredondar(l.preco! * l.qtd) });
        }
        await registrarCompra(db, { mercadoId: mercado.id, data: dataISO, origem: 'manual', chave: null, itens, total: totalFinal });
      });
      Alert.alert('Compra salva!', `${formatarReais(totalFinal)} em ${mercado.nome}.`);
      router.back();
    } catch (e) {
      Alert.alert('Não foi possível salvar', (e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={estilos.tela}>
      <Stack.Screen options={{ title: 'Compra sem nota' }} />
      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        <Text style={estilos.rotulo}>Mercado</Text>
        <Pressable accessibilityRole="button" onPress={() => setEscolhendo(true)} style={estilos.cartao}>
          <Text style={[estilos.textoForte, !mercado && { color: cores.textoSecundario }]}>
            {mercado?.nome ?? 'Toque para escolher'}
          </Text>
        </Pressable>
        <Campo rotulo="Data" value={data} onChangeText={setData} keyboardType="numbers-and-punctuation" />
        <Campo
          rotulo="Valor total"
          placeholder={somaItens ? formatarReais(somaItens) : 'R$ 0,00'}
          value={total}
          onChangeText={setTotal}
          keyboardType="decimal-pad"
        />

        <Text style={[estilos.rotulo, { marginTop: espaco.m }]}>Produtos (opcional)</Text>
        <Text style={estilos.textoFraco}>Anote os produtos para comparar preços depois.</Text>
        {linhas.map((l, i) => (
          <Cartao key={i}>
            <Campo placeholder="Produto" value={l.nome} onChangeText={(t) => mudar(i, 'nome', t)} />
            <View style={estilos.linha}>
              <View style={{ flex: 1 }}>
                <Campo placeholder="Qtd" value={l.qtd} onChangeText={(t) => mudar(i, 'qtd', t)} keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 2 }}>
                <Campo placeholder="Preço unitário" value={l.preco} onChangeText={(t) => mudar(i, 'preco', t)} keyboardType="decimal-pad" />
              </View>
            </View>
          </Cartao>
        ))}
        <Botao titulo="Adicionar produto" icone="plus" tipo="secundario" onPress={() => setLinhas((a) => [...a, { nome: '', qtd: '1', preco: '' }])} />

        <Botao
          titulo={`Salvar ${totalFinal ? formatarReais(totalFinal) : ''}`}
          onPress={salvar}
          carregando={salvando}
          style={{ marginTop: espaco.g }}
        />
      </ScrollView>
      <EscolherMercado
        visivel={escolhendo}
        onFechar={() => setEscolhendo(false)}
        onEscolher={(m) => {
          setMercado(m);
          setEscolhendo(false);
        }}
      />
    </View>
  );
}
