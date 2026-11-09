import { Stack } from 'expo-router';
import { ScrollView, Text } from 'react-native';

import { estilos } from '@/ui/componentes';

const TEXTO_PRIVACIDADE = [
  'Seus dados ficam no seu celular. O app não tem cadastro, não pede login e não envia suas listas, compras ou preços para nenhum servidor nosso.',
  'Câmera: usada só para ler o QR Code do cupom fiscal. Nenhuma foto ou vídeo é gravado.',
  'Nota fiscal: ao ler o QR Code, o app abre o endereço impresso na nota, no site oficial da Secretaria da Fazenda (SEFAZ), para buscar os produtos e preços. Essa consulta é a mesma que você faria pelo navegador.',
  'Backup: o arquivo de cópia de segurança só é criado quando você pede, e você escolhe onde guardá-lo.',
  'Excluir dados: desinstalar o app apaga todos os dados. Você também pode excluir listas e compras dentro do app.',
  'Não coletamos dados pessoais, não usamos publicidade e não compartilhamos informações com terceiros.',
  'Aviso: o Minhas Compras não é um aplicativo oficial da SEFAZ nem de qualquer órgão do governo. A leitura do cupom só abre a consulta pública da nota fiscal.',
  'Contato: vaguinhobom@gmail.com. Versão completa: vdso10.github.io/minhas-compras/privacidade.html',
];

export default function TelaPrivacidade() {
  return (
    <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo}>
      <Stack.Screen options={{ title: 'Privacidade' }} />
      {TEXTO_PRIVACIDADE.map((p) => (
        <Text key={p} style={[estilos.texto, { lineHeight: 26 }]}>
          {p}
        </Text>
      ))}
    </ScrollView>
  );
}
