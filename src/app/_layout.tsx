import { NativeTabs } from 'expo-router/native-tabs';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { NOME_BANCO, prepararBanco } from '@/db/migracoes';
import { IntroAnimada } from '@/ui/IntroAnimada';
import { cores } from '@/ui/tema';

// A abertura nativa fica na tela até a animação assumir (sem "piscar").
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function Layout() {
  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      <SQLiteProvider databaseName={NOME_BANCO} onInit={prepararBanco}>
        <StatusBar style="dark" />
        <NativeTabs
          backgroundColor={cores.cartao}
          indicatorColor={cores.primariaClara}
          labelStyle={{ selected: { color: cores.primaria } }}>
          <NativeTabs.Trigger name="(listas)">
            <NativeTabs.Trigger.Label>Listas</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf="checklist" md="checklist" />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="escanear">
            <NativeTabs.Trigger.Label>Nota fiscal</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf="qrcode.viewfinder" md="qr_code_scanner" />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="precos">
            <NativeTabs.Trigger.Label>Preços</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf="tag" md="sell" />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="gastos">
            <NativeTabs.Trigger.Label>Gastos</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf="chart.bar" md="bar_chart" />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="mais">
            <NativeTabs.Trigger.Label>Mais</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf="ellipsis.circle" md="more_horiz" />
          </NativeTabs.Trigger>
        </NativeTabs>
      </SQLiteProvider>
      <IntroAnimada />
    </View>
  );
}
