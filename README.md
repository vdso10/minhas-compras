# Minhas Compras

App Android simples para controlar os gastos no mercado:

- **Listas de compras** salvas no celular, com preço digitado na hora da compra.
- **Leitura do QR Code do cupom fiscal (NFC-e)**: salva mercado, data, produtos e preços sozinho (testado com os formatos de página da SEFAZ; foco em MG).
- **Comparação de preços** entre os mercados onde *você* comprou, e qual mercado sai mais barato para uma lista.
- **Gastos mês a mês**: gráfico dos últimos 6 meses e quanto subiu ou caiu em relação ao mês anterior.
- Sem login, sem servidor. Backup em arquivo JSON.

Tecnologia: Expo SDK 58, Expo Router (abas nativas), expo-sqlite, expo-camera, TypeScript.

## Rodar no celular

```bash
npm install
npm start          # = expo start --go
```

Instale o app **Expo Go** (Play Store) no Android e escaneie o QR Code que aparece no terminal (celular e computador na mesma rede Wi-Fi).

Se algo nativo não funcionar no Expo Go, gere e instale uma versão de desenvolvimento e use `npm run start:dev`:

```bash
npx eas-cli@latest build -p android --profile development
```

## Verificações

```bash
npm test            # testes da lógica (nota fiscal, comparação, gastos)
npm run typecheck   # TypeScript
npx expo lint       # lint
npx expo-doctor     # configuração do Expo
```

## Estrutura

```
src/app/            telas (cada pasta é uma aba)
  (listas)/         listas de compras (tela inicial)
  escanear/         câmera do QR Code, conferência da nota, compra sem nota
  precos/           comparação de preços por produto
  gastos/           gráfico mensal e histórico de compras
  mais/             backup, mercados, privacidade
src/db/             banco SQLite (migracoes.ts) e consultas (repo.ts)
src/lib/            lógica pura e testada (nfce.ts, comparacao.ts, gastos.ts...)
src/ui/             componentes visuais e tema
__tests__/          testes + páginas de nota fiscal de exemplo
```

Para mudar o banco no futuro, **adicione** uma nova migração no fim da lista em `src/db/migracoes.ts`; nunca altere as antigas, porque quem já tem o app instalado depende delas.

## Publicar na Play Store

Passo a passo completo, com textos da loja e respostas dos formulários do Google: [docs/play-store/PUBLICAR.md](docs/play-store/PUBLICAR.md).

Resumo:

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile production   # gera o .aab
```

O primeiro envio ao Play Console é manual. Os seguintes podem usar `--auto-submit`.

## Limitações conhecidas

- A leitura da nota depende do site da SEFAZ. Se o site mudar o layout ou estiver fora do ar, o app avisa e oferece o lançamento manual. Para ajustar, edite `src/lib/nfce.ts` e adicione a página nova em `__tests__/fixtures/`.
- A comparação usa só os preços das suas compras: quanto mais notas você ler, melhor ela fica.
