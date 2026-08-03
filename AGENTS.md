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
| expo-image | ~56 | Imagens otimizadas (flags, fotos) |
| react-native-reanimated | 4.3.1 | Animações (abertura de pacote) |
| @expo/vector-icons | ^15 | Ícones Ionicons — único sistema de ícones do app, sem emojis em UI |
| react-native-svg | ~15 | Renderização de bandeiras SVG |
| react-native-svg-transformer | ^1.5 | Suporte a importações de SVG |

## Regras
- Nunca importar Infra direto na Presentation — sempre via Main/factories.
- Use case sempre antes da UI.
- Datas são string ISO no domain.

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

npm test              # roda a suíte Jest (535 testes / 62 suítes)
npm run test:coverage
npm run typecheck     # tsc --noEmit — depende de .expo/types/router.d.ts
                       # (gitignored); rode `npx expo start` uma vez após
                       # um checkout novo antes de confiar neste comando
npm run lint          # expo lint
```

Plano e inventário de testes: [testing-plan.md](docs/testing-plan.md).