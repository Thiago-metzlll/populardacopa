# Popular da Copa — Agent Instructions

Ver documentação completa: [technical-readme.md](docs/technical-readme.md)

## Stack
React Native + Expo Router + TypeScript, Clean Architecture.

### Stack tecnológica (Versões)

| Tecnologia | Versão | Uso |
|---|---|---|
| React Native | 0.85.3 | UI nativa cross-platform |
| Expo SDK | ~56 | Build, plugins, dev tools |
| Expo Router | ~56.2 | Roteamento file-system |
| TypeScript | ~6.0 | Tipagem estrita end-to-end |
| expo-linear-gradient | ~56 | Gradientes nos cards |
| expo-image | ~56 | Imagens otimizadas (bandeiras, fotos) |
| expo-sqlite | ~56 | Catálogo estático local (times, jogadores, partidas, figurinhas) |
| firebase | ^12 | Auth + Firestore (dados por usuário) |
| react-native-reanimated | 4.3.1 | Animações (abertura de pacote) |
| @expo/vector-icons | ^15 | Ícones Ionicons — único sistema de ícones do app, sem emojis em UI |

> Não há mais SVG no projeto: `react-native-svg` e `react-native-svg-transformer` foram
> removidos junto com `assets/flags/`. Toda bandeira vem de `https://flagcdn.com/w160/<iso2>.png`
> via `expo-image` — ver `MolduraIndividualPais`.

## Regras
- Nunca importar Infra direto na Presentation — sempre via Main/factories.
- Use case sempre antes da UI.
- Datas são string ISO no domain.
- Bandeiras: sempre `MolduraIndividualPais` (nunca montar a URL do flagcdn na tela).
- `SafeAreaView` sempre com `edges` explícito — sem isso ele aplica os quatro insets
  e cria espaço fantasma (foi o que aconteceu com a `MenuBar`; ver seção 9.10 do technical-readme).

## Onde fica cada teste
- `domain/usecases` e `infra/repositories` → em `src/features/<feature>/test/`, espelhando a camada
  (ex.: `album/test/domain/usecases/BuyStickerPack.test.ts` testa `album/domain/usecases/BuyStickerPack.ts`).
- Todo o resto (`presentation/hooks`, `presentation/components`, `domain/constants`,
  `infra/stores`, `main/factories`) → co-localizado, ao lado do arquivo testado.
- Ao mover um teste, lembre que as strings de `jest.mock('../...')` também são caminhos
  relativos e **não** são checadas pelo `tsc` — quebram só em runtime.

## Comandos

```bash
npm install
npx expo start
# Limpar cache Metro após mudanças estruturais:
npx expo start --clear

npm test              # roda a suíte Jest (544 testes / 63 suítes)
npm run test:coverage
npm run typecheck     # tsc --noEmit — depende de .expo/types/router.d.ts
                       # (gitignored); rode `npx expo start` uma vez após
                       # um checkout novo antes de confiar neste comando
npm run lint          # expo lint
```

Plano e inventário de testes: [testing-plan.md](docs/testing-plan.md).