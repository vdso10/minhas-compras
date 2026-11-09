import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { obterProduto, precosDosProdutos } from '@/db/repo';
import { compararProduto, type PrecoPorMercado } from '@/lib/comparacao';
import { isoParaBR } from '@/lib/datas';
import { formatarReais } from '@/lib/moeda';
import { Cartao, estilos, Icone, Vazio } from '@/ui/componentes';
import { IlustraEtiqueta } from '@/ui/ilustracoes';
import { cores } from '@/ui/tema';
import { useAoFocar } from '@/ui/useAoFocar';

export default function TelaPrecoProduto() {
  const db = useSQLiteContext();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const [nome, setNome] = useState('Produto');
  const [linhas, setLinhas] = useState<PrecoPorMercado[]>([]);

  useAoFocar(async () => {
    const p = await obterProduto(db, id);
    if (p) setNome(p.nome);
    setLinhas(compararProduto(await precosDosProdutos(db, [id])));
  }, [db, id]);

  const economia = linhas.length > 1 ? linhas[linhas.length - 1].ultimoPreco - linhas[0].ultimoPreco : 0;

  return (
    <View style={estilos.tela}>
      <Stack.Screen options={{ title: nome }} />
      <ScrollView contentContainerStyle={estilos.conteudo}>
        {linhas.length === 0 && <Vazio ilustracao={<IlustraEtiqueta />} texto="Sem preços para este produto." />}
        {economia > 0 && (
          <Cartao style={{ backgroundColor: cores.primariaClara, borderColor: cores.primaria }}>
            <Text style={estilos.texto}>
              Comprando no <Text style={{ fontWeight: '800' }}>{linhas[0].mercado_nome}</Text> você economiza até{' '}
              <Text style={{ fontWeight: '800' }}>{formatarReais(economia)}</Text> por unidade.
            </Text>
          </Cartao>
        )}
        {linhas.map((l) => (
          <Cartao key={l.mercado_id} style={l.maisBarato && { borderColor: cores.primaria, borderWidth: 2 }}>
            <View style={estilos.linha}>
              <Text style={[estilos.textoForte, { flex: 1 }]}>{l.mercado_nome}</Text>
              <Text style={[estilos.textoForte, l.maisBarato && { color: cores.primaria }]}>{formatarReais(l.ultimoPreco)}</Text>
            </View>
            {l.maisBarato && (
              <View style={[estilos.linha, { gap: 4 }]}>
                <Icone nome="trophy" tamanho={18} cor={cores.primaria} />
                <Text style={{ color: cores.primaria, fontWeight: '700' }}>Mais barato</Text>
              </View>
            )}
            <Text style={estilos.textoFraco}>
              Último preço em {isoParaBR(l.ultimaData)}
              {l.vezes > 1 ? ` • média ${formatarReais(l.media)} em ${l.vezes} compras` : ''}
            </Text>
          </Cartao>
        ))}
        <Text style={[estilos.textoFraco, { textAlign: 'center' }]}>
          Preços baseados nas suas compras. Quanto mais notas você ler, melhor a comparação.
        </Text>
      </ScrollView>
    </View>
  );
}
