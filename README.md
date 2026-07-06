# Popular da Copa

**Popular da Copa** é um aplicativo mobile para torcedores acompanharem a Copa do Mundo com engajamento ativo: visualize grupos e classificações, gerencie seus times favoritos, colecione figurinhas digitais e dê palpites nas partidas para ganhar moedas virtuais.

---

## O que o app faz

O aplicativo é organizado em quatro pilares de funcionalidade principais, precedidos por um fluxo de autenticação e uma Home centralizada:

### 🏆 Grupos
Exibe a tabela de cada grupo da Copa (pontuação, saldo de gols, vitórias/empates/derrotas), refletindo o estado atual do torneio.

### 🃏 Perfil & Álbum de Figurinhas
Hub da coleção pessoal. O usuário vê seu progresso via `CardMinhaColeção`, pode visitar o Mercado de Figurinhas para trocar duplicatas, abrir pacotes com animação e compartilhar figurinhas via `CompartilhBtn`.

### ⭐ Times (Meus Times)
O usuário monta seu painel de seleções favoritas com `SearchInput` para busca com debounce. Uma tela de detalhes do time exibe conquistas (`CardConquistas`) e o molde de jogadores (`MoldeJogadores`). Ao tocar em um jogador, abre a tela com `CardCaracterísticas`.

### 🎯 Apostas & Palpites
Lista as próximas partidas. O usuário confirma um palpite pela Tela Palpite e consulta resultados na Tela Histórico de Apostas.

---

## Fases de construção (planejadas no grafo)

O grafo define **5 fases** de implementação, da mais simples à mais complexa:

### Fase 1 — Telas principais
> Antes de qualquer construção visual, os use cases de cada tela são implementados primeiro.

| Tela | Use cases / Componentes chave |
|---|---|
| Tela Grupos | Use cases, Componentes |
| Tela Perfil (com as figurinhas) | Use cases, Componentes ↔ `CardMinhaColeção` |
| Tela Times | Use cases, Componentes → `SearchInput` |
| Tela Apostas | Use cases, Componentes |

### Fase 2 — Telas secundárias ou derivadas

| Tela | Use cases / Componentes chave |
|---|---|
| Tela Mercado de Figurinhas | Use cases, Componentes → `CompartilhBtn` |
| Tela Time | Use cases, Componentes → `CardConquistas`, `MoldeJogadores` |
| Tela Palpite | Use cases, Componentes |

### Fase 3 — Outras telas secundárias ou derivadas

| Tela | Use cases / Componentes chave |
|---|---|
| Animação Abrir Pacote | — |
| Tela Jogador | Use cases, Componentes → `CardCaracterísticas` |
| Tela Histórico de Apostas | Use cases, Componentes |

### Fase 4 — Tela Login e SignUp

| Tela | Componentes chave |
|---|---|
| Tela Entrar | `MoldeInputs` |
| Tela Cadastro | `MoldeInputs` |

### Fase 5 — Tela Home

| Tela | Use cases / Componentes chave |
|---|---|
| Tela Home | useCases, Componentes → `MoldeCardHome`, `CardPartida` |

---

## Componentes globais compartilhados (`shared`)

Instanciados no nível raiz e disponibilizados para todas as features:

| Componente | Descrição |
|---|---|
| `NavBar` | Barra de navegação inferior (tabs) |
| `MenuBar` | Barra de menu superior contextual |
| `CardFigurinha` | Card visual de uma figurinha individual |
| `MolduraIndividualPaís` | Moldura com bandeira/identidade visual de cada país |
| `BotãoHomeMolde` | Molde de botão padrão para ações primárias |
| `CardColeção` | Card de resumo de coleção (usado em múltiplos contextos) |
| `PalpiteBtn` | Botão de confirmar palpite, reutilizável entre telas |

---

## Navegação e fluxo de telas

```
App
│
├── Auth (Fase 4)
│   ├── Tela Entrar       ← Login com MoldeInputs
│   └── Tela Cadastro     ← Cadastro com MoldeInputs
│
├── Tela Home (Fase 5)    ← MoldeCardHome + CardPartida
│
└── Telas principais (Fases 1–3)
    ├── Tela Grupos
    ├── Tela Perfil (com as figurinhas)
    │   ├── CardMinhaColeção
    │   ├── Tela Mercado de Figurinhas
    │   │   └── CompartilhBtn
    │   └── Animação Abrir Pacote
    ├── Tela Times
    │   ├── SearchInput
    │   └── Tela Time
    │       ├── CardConquistas
    │       ├── MoldeJogadores
    │       └── Tela Jogador
    │           └── CardCaracterísticas
    └── Tela Apostas
        ├── Tela Palpite
        └── Tela Histórico de Apostas
```

---

## Stack tecnológica

| Tecnologia | Versão | Uso |
|---|---|---|
| React Native | 0.85.3 | UI nativa cross-platform |
| Expo SDK | ~56 | Build, plugins, dev tools |
| Expo Router | ~56.2 | Roteamento file-system |
| TypeScript | ~6.0 | Tipagem estrita end-to-end |
| expo-linear-gradient | ~56 | Gradientes nos cards |
| expo-image | ~56 | Imagens otimizadas (flags, fotos) |
| react-native-reanimated | 4.3.1 | Animações (abertura de pacote) |
| @expo/vector-icons | ^15 | Ícones Ionicons nas tabs |

---

## Arquitetura

O projeto segue **Clean Architecture** com separação estrita de camadas:

```
Presentation  →  Main (Factories)  →  Domain (Use Cases + Entities)
                                   ←  Infra (implementações concretas)
```

| Camada | Responsabilidade | Pode importar |
|--------|-----------------|---------------|
| **Domain** | Entidades, interfaces de repository, use cases | Nada externo |
| **Infra** | Implementações concretas (Mock, futuramente API) | Domain |
| **Main** | Factories que conectam Infra ↔ Use Cases | Domain + Infra |
| **Presentation** | Hooks, telas, componentes | Domain (tipos) + Main (factories) |

---

## Estrutura de pastas

```
app/
│   _layout.tsx           ← Root Stack (UserProvider + Stack global)
│   apostas.tsx           → ApostasScreen
│   grupos.tsx            → GroupsScreen
│   (tabs)/
│       _layout.tsx       ← Tabs + CustomHeader
│       index.tsx         → HomeScreen (atual, stub da Fase 5)
│       times.tsx         → TimesScreen
│       perfil.tsx        → ProfileScreen

src/
  shared/
    domain/entities/      → User, Country, Confederation
    presentation/
      components/         → CustomHeader
                            [pendente] NavBar, MenuBar, CardFigurinha,
                                       MolduraIndividualPaís, BotãoHomeMolde,
                                       CardColeção, PalpiteBtn
      contexts/           → UserContext (usuário logado global)
      screens/            → HomeScreen
                            [pendente] Tela Home com MoldeCardHome + CardPartida
      theme/              → colors, typography, spacing, radius

  features/
    grupos/               → Group, GroupStanding | GetAllGroups | GroupsScreen
    times/                → Team, Player | SearchTeams, ToggleFavorite | TimesScreen + SearchInput
                            [pendente] Tela Time (CardConquistas, MoldeJogadores)
                                       Tela Jogador (CardCaracterísticas)
    album/                → Sticker, UserCollection | GetUserProfile, OpenPackage
                            → ProfileScreen + CardMinhaColeção
                            [pendente] Mercado de Figurinhas (CompartilhBtn)
                                       Animação Abrir Pacote
    apostas/              → Match, Prediction | GetUpcomingMatches, CreatePrediction
                            → ApostasScreen + ContainerAposta + BotaoHistorico
                            [pendente] Tela Palpite
                                       Tela Histórico de Apostas
    auth/                 → [pendente] Tela Entrar + Tela Cadastro + MoldeInputs
```

---

## Status de implementação

### Domain + Infra

| Feature | Entities | Repository | Use Cases | Infra/Mock |
|---------|:--------:|:----------:|:---------:|:----------:|
| grupos  | ✅ | ✅ | ✅ | ✅ |
| times   | ✅ | ✅ | ✅ | ✅ |
| album   | ✅ | ✅ | ✅ | ✅ |
| apostas | ✅ | ✅ | ✅ | ✅ |
| auth    | ⬜ | ⬜ | ⬜ | ⬜ |

### Presentation — por fase do grafo

| Fase | Tela / Componente | Status |
|------|---|---|
| **Fase 1** | GroupsScreen | ✅ |
| **Fase 1** | ProfileScreen + CardMinhaColeção | ✅ |
| **Fase 1** | TimesScreen + SearchInput | ✅ |
| **Fase 1** | ApostasScreen + ContainerAposta + BotaoHistorico | ✅ |
| **Fase 2** | Tela Mercado de Figurinhas + CompartilhBtn | ⬜ |
| **Fase 2** | Tela Time + CardConquistas + MoldeJogadores | ⬜ |
| **Fase 2** | Tela Palpite | ⬜ |
| **Fase 3** | Animação Abrir Pacote | ⬜ |
| **Fase 3** | Tela Jogador + CardCaracterísticas | ⬜ |
| **Fase 3** | Tela Histórico de Apostas | ⬜ |
| **Fase 4** | Tela Entrar + Tela Cadastro + MoldeInputs | ⬜ |
| **Fase 5** | Tela Home + MoldeCardHome + CardPartida | ⬜ |
| **Global** | NavBar, MenuBar, CardFigurinha, MolduraIndividualPaís, BotãoHomeMolde, CardColeção, PalpiteBtn | ⬜ |

---

## Como rodar

```bash
npm install
npx expo start
# Limpar cache Metro após mudanças estruturais:
npx expo start --clear
```

---

## Convenções

- **Datas** são sempre `string` ISO no domain; formatação fica na apresentação.
- **Entidades coesas** que só existem em função de outra ficam no mesmo arquivo (ex: `Match` + `MatchOdds`).
- **Mocks simulam latência** de 300–500ms para forçar correto tratamento de `loading`.
- **Estado em memória**: dados resetam a cada reload — aceito nesta fase.
- **Palpite vs Aposta**: "Aposta" é a feature/tela. "Palpite" (`Prediction`) é a entidade — previsão de resultado do usuário.
- **Tela Times** exibe apenas times favoritados (`GetFavoriteTeams`), não a lista global de seleções.
- **Use case antes da tela**: conforme o grafo, o use case de cada tela é construído antes da interface visual.
