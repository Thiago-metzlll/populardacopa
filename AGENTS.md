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

## Comandos

```bash
npm install
npx expo start
# Limpar cache Metro após mudanças estruturais:
npx expo start --clear
```