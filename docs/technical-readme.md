# Technical README — Popular da Copa

Documento de referência técnica: decisões arquiteturais, camadas implementadas, contratos de domínio, mapeamento fiel do grafo de planejamento e plano de implementação das fases pendentes.

---

## 1. Arquitetura: Clean Architecture + Expo Router

### Regra de Dependência

```
Presentation  ──►  Main (Composition Root)  ──►  Domain
                                             ◄──  Infra
```

O fluxo de conhecimento aponta sempre para o centro (Domain). Nenhuma camada interna importa nada de uma camada externa.

### Camadas

#### Domain (Núcleo — zero dependências externas)
- **Entities**: tipos/interfaces TypeScript puros. Nenhuma classe com comportamento — apenas contratos de dados.
- **Repository Interfaces**: definem *o que* a infra precisa fazer, sem ditar *como*.
- **Use Cases**: cada use case tem um único método `execute()`, recebe um repository por injeção de dependência e encapsula uma única regra de negócio.

> **Princípio do grafo**: "antes da construção visual, construímos o useCase de cada uma." O use case de cada tela é implementado antes de qualquer componente UI.

#### Infra (Borda externa — implementações concretas)
- **Mock Repositories**: implementam as interfaces do Domain usando estado em memória.
- **Seeds**: dados fixos realistas (times, grupos, figurinhas, partidas).
- **Delay simulado**: todo método async insere `setTimeout` de 300–500ms para forçar os hooks a tratarem `loading: true`.
- **Singleton local**: cada feature mantém uma instância única do repository em `main/factories/repositoryInstance.ts`, garantindo persistência de estado entre navegações.

#### Main — Composition Root
- **Factories** (`make*.ts`): funções puras que instanciam infra + use case e retornam o use case configurado. É o único lugar do projeto que importa simultaneamente Domain e Infra.

```ts
// Exemplo: makeGetUpcomingMatches.ts
export const makeGetUpcomingMatches = () =>
  new GetUpcomingMatches(matchRepositoryInstance);
```

#### Presentation (UI — React Native)
- **Custom Hooks** (`use*.ts`): gerenciam `useState` para `data | loading | error`, chamam factories no `useEffect` ou em handlers. Nenhum Redux — estado local ao hook + Context API.
- **Context API**: `UserContext` provê o usuário logado globalmente (injetado no Root Layout).
- **Screens**: componentes apresentacionais que consomem hooks. Toda lógica fica no hook.
- **Components**: peças reutilizáveis — globais e específicas de feature.

#### Root Shared (Diretórios `src/`)
- **`src/components/`**: Componentes globais de UI (ex: elementos básicos do sistema).
- **`src/constants/`**: Constantes globais do aplicativo.
- **`src/hooks/`**: Hooks genéricos reutilizáveis por múltiplas features.

---

## 2. Roteamento — Expo Router

```
app/
  _layout.tsx       → RootLayout: <UserProvider><Stack>
                        Stack.Screen "(tabs)"   headerShown: false
                        Stack.Screen "grupos"   presentation: modal
                        Stack.Screen "apostas"  presentation: modal
  apostas.tsx       → modal de apostas
  grupos.tsx        → modal de grupos
  (tabs)/
    _layout.tsx     → TabsLayout: header={() => <CustomHeader />}
                        tabBarStyle: background #1E1E24, sem borda
                        activeTintColor: colors.primary (#B4FF00)
    index.tsx       → HomeScreen (stub atual; substituída pela Tela Home da Fase 5)
    times.tsx       → TimesScreen
    perfil.tsx      → ProfileScreen
```

**Convenção**: as rotas em `app/` são shells que importam as `*Screen` de `src/features/*/presentation/screens/`. Nenhuma lógica de negócio vive dentro de `app/`.

**Fase 4 (Auth)**: as telas `Tela Entrar` e `Tela Cadastro` serão adicionadas como Stack screens na raiz, antes do acesso às tabs.

### 2.1 Navegação e fluxo de telas (Grafo)

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
    │   ├── CardColeção
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

### 2.2 Estrutura de pastas completa

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
      components/         → MenuBar (top header, canônico)
                            NavBar (tab bar inferior, canônico)
                            CustomHeader (re-export de MenuBar — compat.)
                            [pronto] CardColeção, CardFigurinha,
                                     MolduraIndividualPaís, BotãoHomeMolde,
                                     PalpiteBtn
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
                            → ProfileScreen + CardColeção
                            [pendente] Mercado de Figurinhas (CompartilhBtn)
                                       Animação Abrir Pacote
    apostas/              → Match, Prediction | GetUpcomingMatches, CreatePrediction
                            → ApostasScreen + ContainerAposta + BotaoHistorico
                            [pendente] Tela Palpite
                                       Tela Histórico de Apostas
    auth/                 → [pendente] Tela Entrar + Tela Cadastro + MoldeInputs
```

---

## 3. Design System (Theme)

Localizado em `src/shared/presentation/theme/`:

```ts
colors = {
  background:    '#1A1A1E',   // fundo global
  surface:       '#24242B',   // cards e superfícies elevadas
  primary:       '#B4FF00',   // verde-limão neon (CTA, bordas ativas)
  secondary:     '#FF6B35',   // laranja para destaques secundários
  textPrimary:   '#FFFFFF',
  textSecondary: '#A0A0A0',
  border:        '#B4FF00',
  danger:        '#FF4B4B',
}

typography = {
  heading:    { fontSize: 24, fontWeight: 'bold' },
  subheading: { fontSize: 18, fontWeight: '600' },
  body:       { fontSize: 14, fontWeight: 'normal' },
  caption:    { fontSize: 12, fontWeight: 'normal' },
}

spacing  = { xs, sm, md, lg, xl, xxl }
radius   = { sm, md, lg }
```

---

## 4. Componentes Globais Compartilhados (`shared`)

Definidos no grafo como componentes reutilizáveis em nível de aplicação:

| Componente | Localização planejada | Status |
|---|---|---|
| `NavBar` | `src/shared/presentation/components/NavBar` | ✅ |
| `MenuBar` | `src/shared/presentation/components/MenuBar` | ✅ |
| `CardFigurinha` | `src/shared/presentation/components/CardFigurinha` | ✅ |
| `MolduraIndividualPaís` | `src/shared/presentation/components/MolduraIndividualPais` | ✅ |
| `BotãoHomeMolde` | `src/shared/presentation/components/BotaoHomeMolde` | ✅ |
| `CardColeção` | `src/shared/presentation/components/CardColecao` | ✅ |
| `PalpiteBtn` | `src/shared/presentation/components/PalpiteBtn` | ✅ |

> `CustomHeader` já está implementado como componente global em `src/shared/presentation/components/CustomHeader.tsx`.

---

## 5. Features Implementadas

### `grupos` — ✅ Completo (Fase 1)

- **Domain**: `Group { id, name, standings: GroupStanding[] }` · `GroupStanding { teamId, points, wins, draws, losses, goalDifference }`
- **Use Case**: `GetAllGroups.execute()` → `Group[]`
- **Infra**: `MockGroupRepository` com seed de 2 grupos e standings ranqueados por pontos
- **Presentation**: `GroupsScreen` via `useGroups` · Rota: `/grupos` (modal)

### `times` — ✅ Fase 1 completa · ⬜ Fases 2 e 3 pendentes

- **Domain**: `Team`, `Player`, `PlayerStats` · `TeamRepository`: `getAll`, `getFavorites`, `toggleFavorite`, `search`
- **Use Cases**: `GetFavoriteTeams`, `SearchTeams`, `ToggleFavoriteTeam`
- **Infra**: `MockTeamRepository` com estado mutável em memória · 9 seleções no seed
- **Presentation (✅)**: `TimesScreen` + `SearchInput` (debounce 500ms) via `useFavoriteTeams`
- **Pendente (Fase 2)**: `Tela Time` → `CardConquistas` + `MoldeJogadores`
- **Pendente (Fase 3)**: `Tela Jogador` → `CardCaracterísticas`

### `album` — ✅ Fase 1 completa · ⬜ Fases 2 e 3 pendentes

- **Domain**: `Sticker { id, playerId, rarity, obtainedAt }` · `UserCollection { stickerIds[] }` · `Package { stickers[] }`
- **Use Cases**: `GetUserProfile.execute(userId)` · `OpenPackage.execute(userId)` → `Sticker[]`
- **Infra**: `MockAlbumRepository` — 100 figurinhas no seed, 78 pré-atribuídas ao usuário mock · `openPackage` sorteia 3 stickers não duplicados
- **Presentation (✅)**: `ProfileScreen` via `useUserProfile` + `useOpenPackage` · `CardColeção` (shared) reutilizado na `HomeScreen`
- **Pendente (Fase 2)**: `Tela Mercado de Figurinhas` → `CompartilhBtn`
- **Pendente (Fase 3)**: `Animação Abrir Pacote` (react-native-reanimated)

### `apostas` — ✅ Fase 1 completa · ⬜ Fases 2 e 3 pendentes

- **Domain**:
  - `Match { id, homeTeamId, awayTeamId, date, phase, status, odds: MatchOdds }`
  - `Prediction { id, userId, matchId, predictedOutcome, predictedScore?, createdAt }`
  - `PredictionHistory { userId, predictions: Prediction[] }`
- **Use Cases**: `GetUpcomingMatches`, `CreatePrediction`, `GetPredictionHistory`
- **Infra**: `MockMatchRepository` filtra por `status === 'scheduled'` · seed com 4 partidas
- **Presentation (✅)**: `ApostasScreen` + `ContainerAposta` + `BotaoHistorico`
- **Pendente (Fase 2)**: `Tela Palpite` (formulário de confirmação do palpite)
- **Pendente (Fase 3)**: `Tela Histórico de Apostas`

### `auth` — ⬜ Fase 4 (não iniciada)

- Feature a ser criada: `src/features/auth/`
- **Domain**: `AuthRepository` (interface) · use cases: `Login`, `Register`
- **Presentation**: `Tela Entrar` + `Tela Cadastro` + `MoldeInputs` (componente de input reutilizável)
- O `MoldeInputs` é compartilhado entre ambas as telas de auth

### `home` — ⬜ Fase 5 (stub existente)

- A `HomeScreen` atual é um hub provisório
- **Fase 5 planeja**: `Tela Home` com `MoldeCardHome` (card template para partidas em destaque) + `CardPartida` (card individual de uma partida)
- Use cases específicos da Home a definir (provavelmente composição de outros existentes)

---

## 6. Plano de Implementação por Fase

### Fase 2 — Telas secundárias derivadas

**Tela Palpite** (derivada de `ApostasScreen`):
- Parâmetro de entrada: `matchId` via Expo Router params
- Consome: `useCreatePrediction`
- UI: seleção de outcome (Casa / Empate / Visitante) + placar opcional + confirmação com `PalpiteBtn`

**Tela Time** (derivada de `TimesScreen`):
- Parâmetro: `teamId`
- UI: cabeçalho do time + `CardConquistas` (troféus/histórico) + `MoldeJogadores` (lista com template de jogador)

**Tela Mercado de Figurinhas** (derivada de `ProfileScreen`):
- Lista figurinhas disponíveis para troca
- `CompartilhBtn`: aciona `expo-sharing` com imagem da figurinha gerada

### Fase 3 — Telas terciárias

**Tela Jogador** (derivada de `Tela Time`):
- Parâmetro: `playerId`
- UI: foto, posição, número, `CardCaracterísticas` (stats: gols, assistências, cartões, minutos)

**Tela Histórico de Apostas** (derivada de `ApostasScreen`):
- Consome: `usePredictionHistory`
- UI: FlatList de palpites por data com indicadores de acerto/erro

**Animação Abrir Pacote** (derivada de `ProfileScreen`):
- `react-native-reanimated`: sequência de flip/reveal para 3 figurinhas
- Dispara `useOpenPackage`, aguarda resultado, anima revelação

### Fase 4 — Auth (Login e SignUp)

- `MoldeInputs`: componente compartilhado de campo de texto estilizado (label + input + validação)
- `Tela Entrar`: e-mail + senha + botão entrar → chama use case `Login`
- `Tela Cadastro`: nome + e-mail + senha + confirmação → chama use case `Register`
- Ao autenticar, navega para as tabs (Root Layout atualizado com gate de auth)

### Fase 5 — Tela Home definitiva

- `MoldeCardHome`: template de card maior para partida em destaque (com times, odds, data)
- `CardPartida`: card compacto de partida para lista de próximas partidas
- Substitui o stub atual da `HomeScreen` com uma composição mais rica

---

## 7. Contratos Críticos de Domínio

```ts
// apostas
interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;           // ISO — formatação na presentation
  phase: string;
  status: 'scheduled' | 'live' | 'finished';
  odds?: MatchOdds;
  homeScore?: number;
  awayScore?: number;
}
interface MatchOdds { homeWin: number; draw: number; awayWin: number; }

interface Prediction {
  id: string;
  matchId: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  reward: PredictionReward;
  status: 'pending' | 'won' | 'lost';
  createdAt: string;
}

interface PredictionHistory {
  predictions: Prediction[];
  totalPoints: number;
  successRate: number;
}

// album
interface Sticker {
  id: string;
  playerId?: string;
  teamId?: string;
  rarity: 'comum' | 'rara' | 'lendaria';
  imageUrl: string;
  obtainedAt: string;
}

interface UserCollection {
  userId: string;
  albumId: string;
  stickerIds: string[];
  progress: number;
}

// times
interface Player {
  id: string;
  teamId: string;
  name: string;
  position: string;
  number: number;
  stats: PlayerStats;
}
interface PlayerStats {
  goals: number;
  assists: number;
  matchesPlayed: number;
  worldCupsPlayed: number;
}
```

---

## 8. Padrões e Decisões Técnicas

| Decisão | Justificativa |
|---|---|
| Sem Redux / Zustand | Estado local ao hook é suficiente nesta escala; Context cobre o user global |
| Singleton de repository | Persistência de estado entre telas sem store global; reset a cada reload é aceito |
| Factories (Main layer) | Único ponto de IoC — troca mock → API sem tocar em domain ou presentation |
| Datas como string ISO | Evita problemas de serialização JSON; `Date` só existe na presentation |
| Debounce no hook | `useEffect` + `clearTimeout` sem biblioteca extra |
| `execute()` único por use case | Interface previsível e testável de forma isolada |
| Use case antes da UI | Conforme o grafo: domain pronto antes de qualquer componente visual |
| `MoldeInputs` compartilhado | Evita duplicação entre `Tela Entrar` e `Tela Cadastro` |
| `MoldeJogadores` vs lista raw | Componente molde garante consistência visual em todos os contextos de jogador |

---

## 9. Adendo ao Grafo de Planejamento — Observações de Implementação

> Registrado em 07/2026 após revisão estrutural do código contra o grafo original.

### 9.1 Inversão de Ordem: HomeScreen antecipada (intencional)

O grafo original posiciona a **Tela Home como Fase 5** — última a ser construída, após Auth (Fase 4). Na implementação, a `HomeScreen` foi criada de forma antecipada como hub de navegação funcional.

**Isso não quebra nenhuma dependência do grafo.** A `HomeScreen` atual:
- Reutiliza `ContainerAposta` (apostas) e `CardColecao` (shared) — componentes já implementados na Fase 1
- Serve como ponto de entrada visual enquanto Auth (Fase 4) e a Home definitiva (Fase 5) não existem
- **Será substituída** pela Tela Home definitiva com `MoldeCardHome` + `CardPartida` quando a Fase 5 for executada

### 9.2 Componentes do Grafo — Aderência confirmada

Todos os nomes de componentes definidos no grafo foram **preservados no código** tal como especificados:

| Grafo | Nome no código | Fase | Status |
|---|---|---|---|
| `CardColeção` | `CardColecao/index.tsx` | 1 | ✅ |
| `SearchInput` | `SearchInput.tsx` | 1 | ✅ |
| `ContainerAposta` | `ContainerAposta.tsx` | 1 | ✅ |
| `BotaoHistorico` | `BotaoHistorico.tsx` | 1 | ✅ |
| `CompartilhBtn` | — | 2 | ⬜ pendente |
| `CardConquistas` | — | 2 | ⬜ pendente |
| `MoldeJogadores` | — | 2 | ⬜ pendente |
| `CardCaracterísticas` | — | 3 | ⬜ pendente |
| `MoldeInputs` | — | 4 | ⬜ pendente |
| `MoldeCardHome` | — | 5 | ⬜ pendente |
| `CardPartida` | — | 5 | ⬜ pendente |

### 9.3 Contratos de Domínio que Evoluíram

Os contratos abaixo foram **intencionalmente expandidos** durante a Fase 1 em relação ao esboço inicial da documentação. O domínio evoluiu para melhor modelar a lógica de negócio:

| Entidade | Evolução |
|---|---|
| `Prediction` | `predictedOutcome` substituído por `predictedHomeScore` + `predictedAwayScore`; adicionados `reward: PredictionReward` e `status: 'pending' \| 'won' \| 'lost'` |
| `PredictionHistory` | Adicionados `totalPoints` and `successRate`; `userId` removido (histórico é consultado por contexto) |
| `Sticker` | `rarity` em português (`'comum'`, `'rara'`, `'lendaria'`); `teamId?` e `imageUrl` adicionados para suportar figurinhas de seleções além de jogadores |
| `UserCollection` | `albumId` and `progress` adicionados para suportar múltiplos álbuns futuros |
| `PlayerStats` | Substituído por `matchesPlayed` + `worldCupsPlayed` (contexto Copa do Mundo); `yellowCards`, `redCards`, `minutesPlayed` removidos por não serem relevantes para o MVP |
| `Match` | `odds` tornado opcional; `homeScore?` e `awayScore?` adicionados para partidas `'finished'` |

### 9.4 Nota sobre Singleton em `grupos`

A feature `grupos` foi atualizada e **agora utiliza o padrão singleton** via `repositoryInstance.ts`, alinhando-a arquiteturalmente com as outras features (times, album, apostas). A factory `makeGetAllGroups` consome essa instância única, garantindo que o estado não seja perdido entre navegações se os `standings` sofrerem atualizações futuras.
