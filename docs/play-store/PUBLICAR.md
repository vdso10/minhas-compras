# Publicar o Minhas Compras no Google Play

Pacote: `com.vaguinho.minhascompras`. Conta EAS (Expo) para gerar o app na nuvem.

Status dos passos: **[x] pronto no projeto**, **[ ] você faz**.

---

## 1. Preparação (feito no projeto)

- [x] Identificador definitivo: `com.vaguinho.minhascompras`
- [x] Ícone 512×512: `docs/play-store/icone-512.png`
- [x] Gráfico de destaque 1024×500: `docs/play-store/grafico-destaque.png`
- [x] Política de privacidade: `docs/privacidade.html` (para o GitHub Pages)
- [x] Só uma permissão: câmera. Microfone bloqueado.
- [x] Versão (versionCode) controlada pelo EAS, com aumento automático a cada build
- [x] Formato AAB (o Google exige), com assinatura gerenciada pelo Google Play (Play App Signing)
- [x] Target SDK: o Expo SDK 58 já atende o mínimo exigido pelo Google

## 2. Publicar a política de privacidade (GitHub Pages)

1. [x] Em https://github.com/new crie o repositório **`minhas-compras`** (público), na conta `vdso10`.
2. [x] No terminal, na pasta do projeto:
   ```bash
   git remote add origin https://github.com/vdso10/minhas-compras.git
   git push -u origin main
   ```
3. [x] No GitHub: **Settings > Pages > Build and deployment > Source: Deploy from a branch > Branch: `main` / pasta `/docs` > Save**.
4. [x] Em 1 ou 2 minutos, o link fica no ar:
   **https://vdso10.github.io/minhas-compras/privacidade.html**

> Se preferir não deixar o código público, crie um repositório separado só com a pasta `docs`.

## 3. Gerar o app (EAS Build)

1. [x] Crie uma conta grátis em https://expo.dev/signup (se ainda não tiver).
2. [x] No terminal: `npx eas-cli@latest login`
3. Depois disso, eu (ou você) rodo:
   ```bash
   npx eas-cli@latest init                                     # liga o projeto à conta Expo
   npx eas-cli@latest build -p android --profile production    # gera o .aab na nuvem (~15 min)
   ```
   No primeiro build, o EAS cria e guarda a **chave de upload** (keystore). Não apague essa chave no expo.dev.
4. Para testar antes num celular: `npx eas-cli@latest build -p android --profile preview` gera um APK instalável.

## 4. Criar o app no Play Console

Em https://play.google.com/console > **Criar app**:

- Nome do app: **Minhas Compras: lista e gastos**
- Idioma padrão: **Português (Brasil) – pt-BR**
- App ou jogo: **App**
- Gratuito ou pago: **Gratuito**
- Aceite as declarações.

## 5. Ficha da loja (Presença na loja > Página principal da loja)

**Nome (até 30):**
```
Minhas Compras: lista e gastos
```

**Descrição curta (até 80):**
```
Lista de compras, leitura do cupom fiscal e controle dos gastos do mês.
```

**Descrição completa (até 4000):**
```
Organize suas compras de mercado e descubra para onde vai o seu dinheiro.

LISTA DE COMPRAS
• Crie quantas listas quiser e marque os itens enquanto compra.
• Digite o preço na hora e acompanhe o total do carrinho.
• Use a mesma lista todo mês: ao finalizar, ela é desmarcada para a próxima vez.

LEITURA DO CUPOM FISCAL (NFC-e)
• Aponte a câmera para o QR Code do cupom e o app salva o mercado, a data, os produtos e os preços.
• Confira os nomes antes de salvar. O app lembra suas escolhas nas próximas notas.
• Sem nota? Lance a compra manualmente.

ONDE É MAIS BARATO
• Veja o preço de cada produto em cada mercado onde você comprou.
• Descubra em qual mercado sua lista sai mais barata.

GASTOS DO MÊS
• Gráfico dos últimos 6 meses.
• Veja se você gastou mais ou menos que no mês anterior, em reais e em porcentagem.

PRIVACIDADE
• Sem cadastro e sem login.
• Seus dados ficam só no seu celular.
• Faça backup quando quiser e guarde onde preferir.

Aviso: o Minhas Compras não é um aplicativo oficial da Secretaria da Fazenda (SEFAZ) nem de qualquer órgão do governo. A leitura do cupom apenas abre a consulta pública da nota fiscal impressa no QR Code.
```

**Gráficos:**
- Ícone: `docs/play-store/icone-512.png`
- Gráfico de destaque: `docs/play-store/grafico-destaque.png`
- [x] **Capturas de tela do celular (6):** `docs/play-store/prints/01.png` a `06.png` (1080×1920). Para refazer a partir de novos prints, coloque-os em `docs/play-store/prints-originais/` e rode `node scripts/gerar-prints.mjs`.

**Detalhes de contato:** e-mail `vaguinhobom@gmail.com`. Site (opcional): `https://vdso10.github.io/minhas-compras/`

**Categoria:** Compras. **Tags:** compras, finanças pessoais, produtividade.

## 6. Conteúdo do app (Política > Conteúdo do app)

| Formulário | Resposta |
|---|---|
| **Política de privacidade** | `https://vdso10.github.io/minhas-compras/privacidade.html` |
| **Acesso ao app** | Todas as funcionalidades estão disponíveis sem acesso especial (sem login) |
| **Anúncios** | Não, o app não contém anúncios |
| **Classificação de conteúdo** | Categoria: *Todos os outros tipos de app*. Responda **Não** para violência, conteúdo sexual, linguagem, drogas, jogos de azar, interação entre usuários, compartilhamento de localização e compras digitais. Resultado esperado: **Livre (L)** |
| **Público-alvo** | **18 anos ou mais** (assim o app não entra nas regras de apps para crianças) |
| **Apps de notícias** | Não |
| **Apps de saúde** | Nenhum recurso de saúde |
| **Recursos financeiros** | *Meu app não oferece nenhum recurso financeiro* (o app só anota gastos e não movimenta dinheiro) |
| **Apps governamentais** | Não (o app não é do governo, só abre a consulta pública da nota) |
| **ID de publicidade** | Não, o app não usa o ID de publicidade |

### Segurança dos dados (Data safety)

- O app coleta ou compartilha algum tipo de dado do usuário? **Não**
- Justificativa (para você saber, não precisa escrever): tudo fica salvo só no aparelho. A imagem da câmera é processada na hora e descartada. A consulta à SEFAZ é feita pelo próprio celular e não envia dados para o desenvolvedor. O backup é um arquivo que o usuário salva onde quiser.
- Resultado na loja: **"Nenhum dado coletado"** e **"Nenhum dado compartilhado com terceiros"**.

## 7. Primeiro envio (manual)

O Google exige que o **primeiro** arquivo seja enviado pelo site:

1. [ ] Baixe o `.aab` do build de produção (link no fim do build ou em expo.dev > Builds).
2. [ ] No Play Console: **Testar e lançar > Teste > Teste interno > Criar nova versão**.
3. [ ] Aceite o **Play App Signing** (o Google guarda a chave final de assinatura).
4. [ ] Envie o `.aab`. Notas da versão:
   ```
   <pt-BR>
   Primeira versão: listas de compras, leitura do cupom fiscal, comparação de preços e gastos do mês.
   </pt-BR>
   ```
5. [ ] Em **Testadores**, crie uma lista com o seu e-mail, salve e publique a versão de teste interno.
6. [ ] Abra o link de teste no celular e instale pelo Google Play.

## 8. Teste fechado (contas pessoais criadas depois de 13/11/2023)

Veja em **Painel**: se aparecer a tarefa *"Teste fechado com pelo menos 12 testadores por 14 dias"*, ela é obrigatória antes da produção.

1. [ ] **Testar e lançar > Teste > Teste fechado > Criar faixa** (ou use a faixa "Alpha").
2. [ ] Adicione **12 ou mais** testadores (Grupo do Google ou lista de e-mails Gmail).
3. [ ] Envie a mesma versão (promover do teste interno) e publique.
4. [ ] Peça aos testadores que aceitem o convite pelo link e **mantenham o app instalado e usem por 14 dias seguidos**.
5. [ ] Depois dos 14 dias: **Painel > Solicitar acesso à produção** e responda as perguntas sobre o teste.

Se a sua conta não tiver essa exigência, vá direto para **Produção > Criar nova versão**.

## 9. Produção

1. [ ] **Testar e lançar > Produção > Países/regiões:** Brasil.
2. [ ] **Criar nova versão** e promover a versão testada. Lançamento gradual sugerido: 20% e depois 100%.
3. [ ] **Enviar para revisão.** A revisão leva de algumas horas a 7 dias.

## 10. Atualizações (automáticas, depois do primeiro envio)

Para o `eas submit` enviar sozinho:

1. [ ] No Google Cloud (https://console.cloud.google.com), no projeto ligado ao Play Console: **IAM > Contas de serviço > Criar**. Depois **Chaves > Adicionar chave > JSON**, e baixe o arquivo.
2. [ ] Ative a **Google Play Android Developer API** nesse projeto.
3. [ ] No Play Console: **Usuários e permissões > Convidar usuário** com o e-mail da conta de serviço, com permissão para **lançar versões** no app.
4. [ ] Salve o JSON como `google-service-account.json` na raiz do projeto. Ele já está no `.gitignore`.
5. A cada atualização:
   ```bash
   # aumente "version" no app.json (ex.: 1.0.1)
   npx eas-cli@latest build -p android --profile production --auto-submit
   ```
   A versão vai publicada para o **teste interno**. Teste no celular e, se estiver tudo certo, promova para **Produção** no Play Console (ou peça ao Claude para promover pela API).
