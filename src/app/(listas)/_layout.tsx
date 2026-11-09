import { Stack } from 'expo-router';

import { cores } from '@/ui/tema';

export default function PilhaLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: cores.fundo },
        headerShadowVisible: false,
        headerTintColor: cores.texto,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        contentStyle: { backgroundColor: cores.fundo },
      }}
    />
  );
}
