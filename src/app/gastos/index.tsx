import { router, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { listarCompras, resumoDasCompras, type CompraLinha } from '@/db/repo';
import { isoParaBR, nomeMesCurto } from '@/lib/datas';
import { gastosPorMes, variacao, type GastoMes } from '@/lib/gastos';
import { formatarReais } from '@/lib/moeda';
import { Cartao, estiloNoGrupo, estilos, Icone, IconeEmBolha, Secao, Vazio } from '@/ui/componentes';
import { IlustraGrafico } from '@/ui/ilustracoes';
import { cores, espaco, fonte, raio } from '@/ui/tema';
import { useAoFocar } from '@/ui/useAoFocar';

export default function TelaGastos() {
  const db = useSQLiteContext();
  const [meses, setMeses] = useState<GastoMes[]>([]);
  const [compras, setCompras] = useState<CompraLinha[]>([]);

  useAoFocar(async () => {
    setMeses(gastosPorMes(await resumoDasCompras(db), 6));
    setCompras(await listarCompras(db));
  }, [db]);

  const atual = meses[meses.length - 1];
  const anterior = meses[meses.length - 2];

  return (
    <View style={estilos.tela}>
      <Stack.Screen options={{ title: 'Gastos' }} />
      <FlatList
        data={compras}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={estilos.conteudoLista}
        ListHeaderComponent={
          atual && compras.length > 0 ? (
            <View>
              <ResumoMes atual={atual} anterior={anterior} meses={meses} />
              <Secao titulo="Últimas compras" />
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          <Vazio ilustracao={<IlustraGrafico />} texto={'Nenhuma compra salva ainda.\nLeia uma nota fiscal ou finalize uma lista.'} />
        }
        renderItem={({ item, index }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/gastos/[id]', params: { id: String(item.id) } })}
            style={({ pressed }) => [estiloNoGrupo(index, compras.length), pressed && { backgroundColor: cores.fundo }]}>
            <View style={estilos.linhaMenu}>
              <IconeEmBolha nome={item.origem === 'nfce' ? 'receipt-text-outline' : 'pencil-outline'} />
              <View style={{ flex: 1 }}>
                <Text style={estilos.textoForte} numberOfLines={1}>
                  {item.mercado_nome}
                </Text>
                <Text style={estilos.textoFraco}>
                  {isoParaBR(item.data)}
                  {item.qtd_itens ? `, ${item.qtd_itens} ${item.qtd_itens === 1 ? 'item' : 'itens'}` : ''}
                </Text>
              </View>
              <Text style={[estilos.textoForte, { fontVariant: ['tabular-nums'] }]}>{formatarReais(item.total)}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

function ResumoMes({ atual, anterior, meses }: { atual: GastoMes; anterior?: GastoMes; meses: GastoMes[] }) {
  const v = variacao(atual.total, anterior?.total ?? 0);
  const temComparacao = !!anterior && anterior.total > 0;
  const subiu = v.tendencia === 'subiu';
  const corVar = subiu ? cores.perigo : v.tendencia === 'caiu' ? cores.sucesso : cores.textoSecundario;
  const fundoVar = subiu ? cores.perigoClaro : v.tendencia === 'caiu' ? cores.primariaClara : cores.fundo;

  return (
    <Cartao style={{ gap: espaco.m }}>
      <View>
        <Text style={estilos.textoFraco}>Gasto em {nomeMesCurto(atual.mes)}</Text>
        <Text style={{ fontSize: fonte.enorme, fontWeight: '700', color: cores.texto, letterSpacing: -0.5, fontVariant: ['tabular-nums'] }}>
          {formatarReais(atual.total)}
        </Text>
      </View>

      {temComparacao ? (
        <View style={[estilos.linha, { gap: espaco.p + 2 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: fundoVar, borderRadius: raio.p, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Icone nome={subiu ? 'trending-up' : v.tendencia === 'caiu' ? 'trending-down' : 'trending-neutral'} tamanho={16} cor={corVar} />
            <Text style={{ fontSize: fonte.pequena, fontWeight: '700', color: corVar }}>
              {v.percentual != null ? `${Math.abs(v.percentual).toFixed(0)}%` : formatarReais(Math.abs(v.diferenca))}
            </Text>
          </View>
          <Text style={[estilos.textoFraco, { flex: 1 }]}>
            {v.tendencia === 'igual'
              ? `igual a ${nomeMesCurto(anterior!.mes)}`
              : `${formatarReais(Math.abs(v.diferenca))} ${subiu ? 'a mais' : 'a menos'} que em ${nomeMesCurto(anterior!.mes)}`}
          </Text>
        </View>
      ) : (
        <Text style={estilos.textoFraco}>Sem compras no mês anterior para comparar.</Text>
      )}

      <Grafico meses={meses} />
    </Cartao>
  );
}

/** Gráfico de barras simples dos últimos meses. */
function Grafico({ meses }: { meses: GastoMes[] }) {
  const maior = Math.max(...meses.map((m) => m.total), 1);
  const ALTURA = 110;
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'flex-end', height: ALTURA + 38, gap: espaco.p, borderTopWidth: 1, borderTopColor: cores.divisoria, paddingTop: espaco.m }}
      accessibilityLabel={meses.map((m) => `${nomeMesCurto(m.mes)}: ${formatarReais(m.total)}`).join(', ')}>
      {meses.map((m, i) => {
        const ultimo = i === meses.length - 1;
        return (
          <View key={m.mes} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 10, color: cores.textoTerciario }} numberOfLines={1}>
              {m.total > 0 ? Math.round(m.total) : ''}
            </Text>
            <View
              style={{
                width: '62%',
                height: Math.max((m.total / maior) * ALTURA, m.total > 0 ? 4 : 2),
                borderRadius: 5,
                backgroundColor: ultimo ? cores.primaria : '#BFE0CD',
              }}
            />
            <Text style={{ fontSize: fonte.mini, color: ultimo ? cores.texto : cores.textoSecundario, fontWeight: ultimo ? '700' : '400' }}>
              {nomeMesCurto(m.mes).split('/')[0]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
