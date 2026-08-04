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
- **Singleton local**: cada feature mantém uma instância única do repository em `main/factories/repositoryInstance.ts`, garantindo persistência de estado entre navegações.
- **Repositórios ativos hoje** (o que `repositoryInstance.ts` de cada feature realmente injeta):

  | Feature | Implementação injetada | Origem dos dados |
  |---|---|---|
  | `grupos` | `SQLiteGroupRepository` | SQLite local |
  | `times` | `SQLiteTeamRepository` | SQLite local (elenco/times) + Firestore (favoritos) |
  | `album` | `FirestoreAlbumRepository` ← recebe `SQLiteAlbumCatalogRepository` | Firestore (coleção/moedas) + SQLite (catálogo) |
  | `apostas` | `SQLiteMatchRepository` (partidas) + `FirestorePredictionRepository` (palpites) | SQLite local + Firestore |
  | `auth` | `FirebaseAuthRepository` | Firebase Auth + Firestore |

- **Não há mais repositório Mock no projeto.** Todos foram substituídos por implementações reais e removidos (ver seções 9.7 e 9.11) — junto com a latência simulada por `setTimeout`, que só existia neles.
- **Seeds**: o catálogo estático vive em `database/` (48 seleções, 1363 jogadores, 72 partidas da fase de grupos geradas por round-robin) e em `album/infra/seed/AlbumSeed.ts` (2 álbuns, 150 figurinhas); tudo é carregado no SQLite pela migration `001_initial.ts`. Dado de usuário não tem seed em código — para popular um usuário de demonstração, use [scripts/seedFirestoreUser.ts](../scripts/seedFirestoreUser.ts).

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
Tudo que é compartilhado de verdade vive em **`src/shared/`** (componentes, tema, contextos, infra de SQLite/Firebase).

> **Sobra do template Expo, não usada pelo app**: `src/components/` (só uma pasta `ui/` vazia), `src/constants/theme.ts`, `src/hooks/use-color-scheme*.ts`, `src/hooks/use-theme.ts` e `src/global.css`. Nenhum desses arquivos tem import fora deles mesmos — o tema real do app é `src/shared/presentation/theme/`. Candidatos a remoção.

---

## 2. Roteamento — Expo Router

```
app/
  _layout.tsx           → RootLayout: <SQLiteProvider><UserProvider><Stack>
                            "(tabs)"                headerShown: false
                            "(auth)"                modal, headerShown: false
                            "grupos"                modal
                            "apostas"               modal
                            "palpite/[matchId]"     modal
                            "abrir-pacote/[packId]" modal
                            "times/[teamId]"
                            "players/[playerId]"
                            "apostas/historico"
                            "mercado/[albumId]"     → Tela Compra Coleção
                            "figurinha/[stickerId]" → Tela Compra Figurinha Individual
                            "figurinhas"            → Tela Todas as Figurinhas
  (tabs)/
    _layout.tsx         → TabsLayout: header={() => <MenuBar />}, tabBar={<NavBar />}
                            4 abas · activeTintColor: colors.primary (#B4FF00)
    index.tsx           → HomeScreen (definitiva — Fase 5 original obsoleta, ver seção 9.8)
    mercado.tsx         → TelaMercado
    perfil.tsx          → ProfileScreen
    times.tsx           → TimesScreen
  (auth)/
    _layout.tsx         → Stack modal público
    entrar.tsx          → TelaEntrar
    cadastro.tsx        → TelaCadastro
    esqueci-senha.tsx   → TelaEsqueciSenha
  apostas.tsx               → ApostasScreen (modal)
  apostas/historico.tsx     → TelaHistoricoApostas
  grupos.tsx                → GroupsScreen (modal)
  palpite/[matchId].tsx     → TelaPalpite
  times/[teamId].tsx        → TelaTime
  players/[playerId].tsx    → TelaJogador
  abrir-pacote/[packId].tsx → AnimacaoAbrirPacote
  mercado/[albumId].tsx     → TelaCompraColecao (grid de figurinhas de um álbum)
  figurinha/[stickerId].tsx → TelaCompraFigurinha
  figurinhas.tsx            → TelaTodasFigurinhas (catálogo por raridade)
```

**Convenção**: as rotas em `app/` são shells que importam as `*Screen` de `src/features/*/presentation/screens/`. Nenhuma lógica de negócio vive dentro de `app/`.

**Gate de autenticação**: não há Stack screen de guarda — quem protege é o `AuthGuard`, montado **dentro do `UserProvider`** (`shared/presentation/contexts/UserContext.tsx`). Ele redireciona para `/entrar` qualquer rota cujo segmento não esteja em `PUBLIC_SEGMENTS` (`(tabs)`, `index`, `times`, `grupos`, `players`, `entrar`, `cadastro`, `esqueci-senha`) — ou seja, `perfil`, `mercado`, `figurinhas`, `figurinha`, `abrir-pacote`, `apostas` e `palpite` exigem login.

### 2.1 Navegação e fluxo de telas (Grafo)

```
App
│
├── Auth (Fase 4)
│   ├── Tela Entrar       ← Login com MoldeInputs
│   └── Tela Cadastro     ← Cadastro com MoldeInputs
│
├── Tela Home             ← HomeScreen definitiva (Fase 5 original obsoleta, ver seção 9.8)
│
└── Telas principais (Fases 1–3)
    ├── Tela Grupos
    ├── Tela Perfil (com as figurinhas)
    │   ├── CardColeção
    │   ├── Tela Mercado de Figurinhas
    │   │   ├── CompartilhBtn
    │   │   └── Tela Compra Coleção        ← grid de figurinhas do álbum
    │   │       └── Tela Compra Figurinha Individual
    │   ├── Tela Todas as Figurinhas       ← catálogo por raridade (Lendárias/Raras/Comuns)
    │   │   └── Tela Compra Figurinha Individual
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

A árvore de `app/` está na seção 2 acima. Do lado do código:

```
database/               ← seed estático versionado (fonte do SQLite)
  teams.ts              → INITIAL_TEAMS (48 seleções, com flagUrl do flagcdn)
  players.ts            → AVAILABLE_PLAYERS (1363 jogadores)
  matches.ts            → INITIAL_MATCHES (72 jogos, round-robin dos 12 grupos)
  types.ts

src/
  shared/
    domain/entities/      → User, Country, Confederation
    infra/
      sqlite/             → database.ts (conexão singleton)
                            migrations/001_initial.ts (schema + seed)
      firebase/           → firebaseConfig.ts
    presentation/
      components/         → MenuBar (top header, canônico)
                            NavBar (tab bar inferior, canônico)
                            CustomHeader (re-export de MenuBar — compat.)
                            CardColeção, CardFigurinha, MolduraIndividualPaís,
                            BotãoHomeMolde, PalpiteBtn, MoldeInputs
      contexts/           → UserContext (usuário logado global + AuthGuard)
      screens/            → HomeScreen (definitiva, ver seção 9.8)
      theme/              → colors, typography, spacing, radius, rarity

  features/<feature>/
    domain/               → entities, repositories (interfaces), usecases, constants
    infra/                → repositories, seed, stores
    main/factories/       → make*.ts + repositoryInstance.ts
    presentation/         → screens, components, hooks
    test/                 → domain/usecases + infra/repositories (ver seção 9.9 / Fase 9)
```

Features: `grupos`, `times`, `album`, `apostas`, `auth` — todas com Domain + Infra + Main + Presentation completos (detalhe por feature na seção 5).

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

rarityColors = {  // token trazido do Figma, mapeado por Sticker['rarity']
  lendaria: { border: '#8432E5', badgeBg: '#EDDCFF', badgeText: '#290055', label: 'Lendária' },
  rara:     { border: '#C3F400', badgeBg: '#EFFFB0', badgeText: '#556D00', label: 'Rara' },
  comum:    { border: '#8E9379', badgeBg: '#E5E2E1', badgeText: '#3A3D30', label: 'Comum' },
}
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

> `CustomHeader.tsx` não é mais um componente: virou um re-export de `MenuBar`, mantido só por compatibilidade. **Em código novo, importe `MenuBar` direto.**

---

## 5. Features Implementadas

### `grupos` — ✅ Completo (Fase 1)

- **Domain**: `Group { id, name, standings: GroupStanding[] }` · `GroupStanding { teamId, points, wins, draws, losses, goalDifference }`
- **Use Case**: `GetAllGroups.execute()` → `Group[]`
- **Infra**: `SQLiteGroupRepository` — 12 grupos (A–L) com standings já calculados pela migration; `getAllGroups` faz N+1 queries (uma por grupo)
- **Presentation**: `GroupsScreen` via `useGroups` · Rota: `/grupos` (modal)

### `times` — ✅ Fases 1, 2 e 3 completas

- **Domain**: `Team`, `Player`, `PlayerStats` · `TeamRepository`: `getAll`, `getFavorites`, `toggleFavorite`, `search`, `getTeamById`, `getPlayersByTeamId`, `getPlayerById`
- **Use Cases**: `GetFavoriteTeams`, `SearchTeams`, `ToggleFavoriteTeam`, `GetTeamById`, `GetPlayerById`
- **Infra**: `SQLiteTeamRepository` — 48 seleções e 1363 jogadores vindos de `database/`; favoritos ficam no **Firestore** (o repositório mistura as duas fontes de propósito) e um `try/catch` devolve `[]` em vez de propagar erro do Firestore
- **Presentation (✅)**: `TimesScreen` — grid de 2 colunas com bandeira (`MolduraIndividualPais`, imagem do flagcdn), ranking e estrela de favorito por card; `SearchInput` (debounce 500ms); seção "Meus Times" acima da lista completa quando logado, via `useTimesScreen`
- **Presentation (✅) (Fase 2)**: `Tela Time` → `CardConquistas` + `MoldeJogadores`
- **Presentation (✅) (Fase 3)**: `Tela Jogador` → `CardCaracterísticas`

### `album` — ✅ Fases 1, 2 e 3 completas + alinhamento com Figma

- **Domain**: `Sticker { id, albumId, playerId, teamId, playerName, price, rarity, imageUrl, obtainedAt }` · `UserCollection { stickerIds[] }` · `Package { stickers[] }` · `DailyClaimStatus { available, nextAvailableAt }` / `DailyCoinsStatus extends DailyClaimStatus { amount }` (`domain/constants/rewards.ts`)
- **Use Cases**: `GetUserProfile`, `OpenPackage`, `GetMarketAlbums`, `BuyStickerPack`, `GetUserCoins` · `GetAlbumById`, `GetAlbumStickers`, `GetAllStickers`, `GetStickersByIds`, `GetUserCollection`, `BuyIndividualSticker` · (novos, seção 9.6) `AddUserCoins`, `GetDailyCoinsStatus`, `ClaimDailyCoins`, `GetFreePackStatus`, `ClaimFreePackage`, `GrantStickers`
- **Infra**: `FirestoreAlbumRepository` (único repositório da feature — `MockAlbumRepository` removido por dead code, ver seção 9.7) — 150 figurinhas no seed (100 no álbum `a1`, 50 no `a2`), preço por raridade (comum=20, rara=60, lendária=150) · `openPackage`/`buyStickerPack` sorteiam 3 stickers não duplicados (lógica de sorteio extraída para `drawAndGrantStickers`, reusada por `claimFreePackage`) · `buyIndividualSticker` compra 1 sticker específico, com progresso sempre calculado contra o álbum `a1` — mesma simplificação consciente de `buyStickerPack`/`drawAndGrantStickers`/`getUserCollection` (ver seção 9.5 e 9.7) · `grantStickers` concede stickers específicos sem custo (usado pelo settlement de apostas)
- **Presentation (✅)**: `ProfileScreen` via `useUserProfile` · `CardColeção` (shared) reutilizado na `HomeScreen`
- **Presentation (✅) (Fase 2)**: `Tela Mercado de Figurinhas` → `CompartilhBtn`
- **Presentation (✅) (Fase 3)**: `Animação Abrir Pacote` (react-native-reanimated) — ver evolução "estilo gacha" na seção 9.6
- **Presentation (✅) (Alinhamento com Figma)**: `Tela Compra Coleção` (`app/mercado/[albumId]`) — grid de figurinhas de um álbum via `useAlbumStickers` · `Tela Compra Figurinha Individual` (`app/figurinha/[stickerId]`) — compra/visualização de 1 sticker via `useStickerDetail` + `useBuyIndividualSticker` · `Tela Todas as Figurinhas` (`app/figurinhas`) — catálogo completo agrupado por raridade via `useAllStickers` · `StickerCard` (componente compartilhado do feature) e `rarityColors` (token de tema) usados nas 3 telas para padronizar a linguagem visual de raridade trazida do Figma
- **Presentation (✅) (Economia de moedas, seção 9.6)**: `CardRecompensaDiaria` (moedas diárias) e `CardPacoteGratis` (pacote grátis diário) na `ProfileScreen`, via `useDailyCoinsReward`/`useFreePackage`

### `apostas` — ✅ Fases 1, 2 e 3 completas

- **Domain**:
  - `Match { id, homeTeamId, awayTeamId, date, phase, status, odds: MatchOdds }`
  - `Prediction { id, userId, matchId, predictedOutcome, predictedScore?, createdAt }`
  - `PredictionHistory { userId, predictions: Prediction[] }`
- **Use Cases**: `GetUpcomingMatches`, `CreatePrediction`, `GetPredictionHistory` · (novo, seção 9.6) `SettlePendingPredictions`
- **Infra**: `SQLiteMatchRepository` — 72 partidas da fase de grupos mais 5 de demonstração (`m1`–`m4` agendadas, `m9` finalizada); filtra `status === 'scheduled'` em `getUpcomingMatches`, gera `odds` só para agendadas e expõe placar só para `finished`, e expõe `getMatchById` para o settlement · `FirestorePredictionRepository` — palpites na coleção raiz `predictions`, um documento por palpite com campo `userId` (seção 9.11)
- **Presentation (✅)**: `ApostasScreen` + `ContainerAposta` + `BotaoHistorico` · dispara `useSettlePendingPredictions` ao montar (seção 9.6)
- **Presentation (✅) (Fase 2)**: `Tela Palpite` (formulário de confirmação do palpite)
- **Presentation (✅) (Fase 3)**: `Tela Histórico de Apostas`

### `auth` — ✅ Fase 4 completa

- **Domain**: `FirebaseUser { uid, email, displayName, isAnonymous }` · `AuthRepository`: `signInAnonymously`, `signInWithEmail`, `register`, `signOut`, `getCurrentUser`, `resetPassword`, `onAuthStateChanged`
- **Infra**: `FirebaseAuthRepository` — único repositório da feature (sem variante Mock); cria/garante o documento Firestore do usuário (`ensureUserDocument`) em login/cadastro
- **Factories**: `makeSignInWithEmail`/`makeRegister`/`makeSignOut`/`makeResetPassword`/`makeOnAuthStateChanged` (wrappers finos sobre `authRepositoryInstance`, sem classe de use case dedicada — o padrão `execute()` é seguido pela factory diretamente)
- **Presentation**: `MoldeInputs` (input compartilhado com label + estado de erro) · `TelaEntrar` + `TelaCadastro` (via `useLogin`/`useRegister`) · `TelaEsqueciSenha` (via `useForgotPassword`, chama `resetPassword` do Firebase)
- **Rotas**: `app/(auth)/{entrar,cadastro,esqueci-senha}.tsx`, stack modal público
- **`UserContext`** (`shared/presentation/contexts/UserContext.tsx`) assina `onAuthStateChanged` e monta o `User` de domínio a partir do `FirebaseUser` + saldo de moedas real (via `album`'s `GetUserCoins`) — ver seção 9.6. `AuthGuard` redireciona rotas protegidas (`perfil`, `mercado`, `abrir-pacote`, `figurinhas`, `figurinha`) para `/entrar` quando deslogado.

### `home` — ✅ Completo (implementada antecipadamente; Fase 5 original obsoleta)

- A `HomeScreen` é a versão definitiva do hub de navegação — reutiliza `ContainerAposta` (apostas) e `CardColecao` (shared)
- **Fase 5 (obsoleta, ver seção 9.8)**: planejava `MoldeCardHome` + `CardPartida`; descartada por redundância com a implementação atual
- Sem use cases dedicados — a Home compõe hooks já existentes de outras features (`useUpcomingMatches`, `useUserProfile`)

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

### Fase 5 — Tela Home definitiva (❌ obsoleta, ver seção 9.8)

~~`MoldeCardHome`: template de card maior para partida em destaque (com times, odds, data)~~
~~`CardPartida`: card compacto de partida para lista de próximas partidas~~
~~Substitui o stub atual da `HomeScreen` com uma composição mais rica~~

Descartada: a `HomeScreen` atual já cumpre esse papel (ver seções 9.1 e 9.8).

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
  albumId: string;
  playerId?: string;
  teamId?: string;
  playerName: string;
  price: number;         // preço de catálogo, usado na compra individual
  rarity: 'comum' | 'rara' | 'lendaria';
  imageUrl: string;
  obtainedAt: string;
}

interface UserCollection {
  userId: string;
  albumId: string;
  stickerIds: string[];
  stickerObtainedAt?: Record<string, string>;  // data ISO de obtenção por stickerId — catálogo SQLite não guarda isso (é estático); ver seção 9.7
  progress: number;
}

// recompensas diárias (moedas + pacote grátis) — domain/constants/rewards.ts
interface DailyClaimStatus {
  available: boolean;
  nextAvailableAt: string | null;  // ISO, null quando available=true
}
interface DailyCoinsStatus extends DailyClaimStatus {
  amount: number;                  // quantidade de moedas do resgate
}

// settlement de apostas — apostas/domain/usecases/SettlePendingPredictions.ts
// injetado no Main, compõe apostas (domínio) com album (recompensa), sem
// que o domínio de apostas importe nada de album diretamente.
interface RewardGranter {
  grantCoins(userId: string, amount: number): Promise<void>;
  grantStickers(userId: string, stickerIds: string[]): Promise<void>;
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
| Singleton de repository | Uma instância por feature, resolvida no Main; hoje todas apontam para SQLite ou Firestore, então não há mais estado de aplicação vivendo dentro do repositório |
| SQLite para catálogo, Firestore para usuário | Ver seção 10 — o que é igual para todos não paga read na nuvem |
| Bandeiras via flagcdn, não SVG local | 48 seleções × manter SVG à mão não escala, e o dado já vinha com `flagUrl` do CDN em `database/teams.ts` — ver seção 9.10 |
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
- Serviu como ponto de entrada visual enquanto Auth (Fase 4) e a Home definitiva (Fase 5) não existiam
- **Tornou-se a versão definitiva**: a Fase 5 original (`MoldeCardHome` + `CardPartida`) foi marcada como obsoleta e não será executada — ver seção 9.8

### 9.2 Componentes do Grafo — Aderência confirmada

Os nomes de componentes definidos no grafo foram **preservados no código** tal como especificados, com exceção de `MoldeCardHome`/`CardPartida` (Fase 5), cuja implementação foi descartada — ver seção 9.8:

| Grafo | Nome no código | Fase | Status |
|---|---|---|---|
| `CardColeção` | `CardColecao/index.tsx` | 1 | ✅ |
| `SearchInput` | `SearchInput.tsx` | 1 | ✅ |
| `ContainerAposta` | `ContainerAposta.tsx` | 1 | ✅ |
| `BotaoHistorico` | `BotaoHistorico.tsx` | 1 | ✅ |
| `CompartilhBtn` | `CompartilhBtn.tsx` | 2 | ✅ |
| `CardConquistas` | `CardConquistas.tsx` | 2 | ✅ |
| `MoldeJogadores` | `MoldeJogadores.tsx` | 2 | ✅ |
| `CardCaracterísticas` | `CardCaracteristicas.tsx` | 3 | ✅ |
| `MoldeInputs` | `MoldeInputs/index.tsx` (shared) | 4 | ✅ |
| `MoldeCardHome` | — | 5 | ❌ obsoleto (ver 9.8) |
| `CardPartida` | — | 5 | ❌ obsoleto (ver 9.8) |

> Componentes criados depois do grafo original, fora dessa lista (ex.: `StickerCard`, `CardRecompensaDiaria`, `CardPacoteGratis`, `CardHistoricoMundial`, `CardResumoApostas`, `CardVitoria`, `CardDerrota`), estão documentados nas seções 9.5 e 9.6 como evoluções — não fazem parte da aderência ao grafo original.

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

### 9.5 Alinhamento com o Figma — Compra de Coleção, Figurinha Individual e Catálogo Completo

> Registrado em 07/2026, após comparação direta do arquivo Figma ("popular da copa") com o código.

A comparação identificou 3 telas presentes no Figma sem equivalente no código: **Tela Compra Coleção**, **Tela Compra Figurinha Individual** e **Telas All Figurinhas**. As telas de **Login**/**Cadastro** também apareceram nessa comparação, mas ficam de fora deste trabalho — já fazem parte do plano de Autenticação em andamento (ver plano de Auth + SQLite).

Essas 3 telas foram implementadas dentro do feature `album` existente (não como feature nova), pois pertencem ao mesmo domínio de figurinhas/álbuns:

- `Sticker` ganhou `albumId`, `playerName` e `price` — necessários porque a tela de Coleção precisa saber quais figurinhas pertencem a qual álbum, e a compra individual precisa de um preço de catálogo por figurinha (antes só existia `Album.price`, o preço do pacote aleatório).
- O repositório ativo em produção era o `FirestoreAlbumRepository` (não o `MockAlbumRepository`, então mantido) — qualquer novo método da interface `AlbumRepository` precisou de implementação nos dois à época; o `MockAlbumRepository` foi removido depois por estar sem nenhum consumidor (ver seção 9.7).
- Novo token de tema `rarityColors` (seção 3) traz a linguagem visual de raridade do Figma (cores por `comum`/`rara`/`lendaria`) para um lugar único e reutilizável, em vez de replicar o visual do Figma tela por tela — o "meio termo" entre o visual mais limpo do código atual e o Figma.
- Fora de escopo, por decisão consciente: refatorar os cards já existentes na `ProfileScreen`/`TelaMercado` para usar o novo `StickerCard`; corrigir o cálculo de progresso hardcoded em `openPackage`/`buyStickerPack` (que sempre usa `mockAlbums[0]`); adicionar uma 4ª aba "Mercado" na bottom nav (o Figma tem 4 abas — Home/Mercado/Perfil/Times — mas o código tinha 3, com Mercado como modal).
  > **Resolvidos depois**: a 4ª aba existe (`app/(tabs)/mercado.tsx` — as tabs hoje batem com o Figma) e o álbum de referência do progresso virou a constante `REFERENCE_ALBUM_ID` na Fase 8 do [testing-plan.md](testing-plan.md), embora ainda seja fixo em `'a1'`. Continua em aberto só a unificação dos cards de figurinha em torno do `StickerCard`.

### 9.6 Ícones, economia de moedas, pacote grátis diário, settlement de apostas e animação gacha

> Registrado em 07/2026. Sessão focada em 6 ajustes pontuais mantendo o rigor da Clean Architecture existente — nenhuma feature nova, apenas evolução das já existentes.

**Ícones (`Ionicons` em vez de emoji)**: os 7 arquivos que usavam caractere emoji cru em `<Text>` (`MenuBar`, `TimesScreen`, `CardCaracteristicas`, `AnimacaoAbrirPacote`, `CardResumoApostas`, `CardVitoria`, `CardDerrota`) foram migrados para `Ionicons`, seguindo o padrão já estabelecido em `StickerCard`/`TelaMercado`. Convenção registrada na seção de Convenções do README.

**Economia de moedas real** (antes só existia débito, nunca crédito):
- `AlbumRepository` ganhou `addUserCoins`, `getDailyCoinsStatus`, `claimDailyCoins` (50 moedas, cooldown 24h) — implementados em `FirestoreAlbumRepository` (via `increment()` do Firestore, importado mas nunca usado antes) e `MockAlbumRepository`.
- A regra de cooldown é uma função pura (`computeDailyClaimStatus`, `domain/constants/rewards.ts`), sem dependência de Firebase — testável isoladamente e reusada tanto para moedas quanto para o pacote grátis diário (abaixo).
- **`UserContext` corrigido**: `coins` era hardcoded `0` em `toUser()` (gap identificado — TODO de uma fase anterior, ver histórico). Agora busca o saldo real via `makeGetUserCoins` ao resolver a sessão, e expõe `refreshCoins()` no contexto para qualquer hook sincronizar o saldo global após uma mutação (já conectado em `useBuyStickerPack`, `useBuyIndividualSticker`, `useDailyCoinsReward`, `useSettlePendingPredictions`).
- UI: `CardRecompensaDiaria` na `ProfileScreen`.

**Pacote grátis diário**: `AlbumRepository.getFreePackStatus`/`claimFreePackage`, reusando a mesma função pura de cooldown (campo Firestore `lastFreePackClaimAt`). O sorteio de figurinhas (antes só existia dentro de `openPackage`) foi extraído para `drawAndGrantStickers`, compartilhado entre `openPackage` (fluxo legado, sem limite) e `claimFreePackage` (gated). O botão "Abrir Pacote" da `ProfileScreen`, que antes chamava `openPackage` sem nenhum limite, foi substituído pelo card `CardPacoteGratis` (gated); `useOpenPackage.ts` foi removido por ter ficado órfão.

**Settlement de apostas (client-side)**: `SettlePendingPredictions` (domínio de `apostas`) resolve palpites `pending` cuja partida já tem `status: 'finished'`, comparando placar previsto vs. real. A recompensa (`PredictionReward.type: 'coins' | 'sticker'`) é concedida via a interface `RewardGranter` (seção 7), **injetada no Main** (`makeSettlePendingPredictions`) — o domínio de `apostas` não importa nada de `album`, só a composição na factory conhece as duas features. Disparado por `useSettlePendingPredictions` ao montar `ApostasScreen` (usuário resolvido). Antes deste trabalho, `status: 'won'/'lost'` só existia como dado estático de seed — nenhuma partida do mock nunca chegava a `'finished'`; foi adicionada uma partida `m9` finalizada + um palpite `pred_9` pendente no seed para o settlement ser observável em desenvolvimento.

**Tela Times redesenhada**: ver seção 5 (`times`) — de lista de texto (`SectionList`) para grid 2 colunas com bandeira. *(As bandeiras eram SVG local à época; migraram para o flagcdn na seção 9.10.)*

**Animação de abrir pacote "estilo gacha"**: ainda 100% `react-native-reanimated` (sem novas dependências — `animejs` não é compatível com React Native). Pacote idle ganhou animação de "respiração" (pulso de escala em loop) e, ao tocar, uma sequência de tremor + expansão antes de revelar; cada figurinha tem uma fase de "carga" (anel pulsante, duração proporcional à raridade — 100ms comum / 500ms rara / 900ms lendária) antes do flip de revelação, seguida de partículas explodindo para fora em raras/lendárias.

**Nota — não era bug**: o problema relatado de "esqueci senha não envia email" foi investigado a fundo (toda a cadeia `TelaEsqueciSenha → useForgotPassword → FirebaseAuthRepository.resetPassword → sendPasswordResetEmail`) e o código estava correto; o email estava caindo na caixa de spam. Nenhuma mudança de código foi necessária.

### 9.7 Correções de persistência de figurinhas, robustez de UI e navegação

> Registrado em 07/2026, após bateria de bugs reportados em teste manual do fluxo de abertura de pacote.

**Bug crítico — `ensureUserDoc` resetava o documento do usuário a cada leitura**: `ensureUserDoc` é chamado antes de toda leitura em `FirestoreAlbumRepository` (`getUserCollection`, `getUserCoins`, `getDailyCoinsStatus`, `getFreePackStatus`) e usava `setDoc(ref, {coins: 200, stickerIds: [], progress: 0, ...}, {merge: true})`. `merge: true` só preserva campos **ausentes** do payload — campos presentes são substituídos integralmente pelo valor passado, não mesclados. Como todo campo do usuário aparecia com um valor "zerado" fixo, **toda leitura desfazia silenciosamente qualquer compra ou figurinha ganha anteriormente** (moedas voltavam a 200, `stickerIds` voltava a `[]`). Corrigido: `ensureUserDoc` agora faz `getDoc` primeiro e só grava os valores padrão se o documento ainda não existir.

**Bug — double-draw na abertura de pacote**: `pendingPackStore` (`infra/stores/pendingPackStore.ts`) foi criado para `buyStickerPack` gravar o sorteio já persistido e `useAbrirPacote` reaproveitar, evitando um segundo sorteio. A escrita (`useBuyStickerPack`) estava conectada, mas `useAbrirPacote` nunca lia o store — chamava `openPackage` de novo incondicionalmente, que ignora `packageId` e sorteia+persiste **outras** 3 figurinhas independentes. Resultado: cada compra gravava 6 figurinhas em vez de 3, e a animação revelava figurinhas diferentes das realmente compradas. Corrigido: `useAbrirPacote` agora lê do `pendingPackStore` quando disponível (com fallback pra `openPackage` se o pacote for aberto sem passar por uma compra, ex. deep link).

**Novo campo Firestore `stickerObtainedAt`**: o catálogo SQLite é estático (sem noção de usuário), então `obtainedAt` sempre vinha `''` ao recarregar uma figurinha já possuída — quebrando a ordenação de "Recentes" (`NaN` na comparação de datas) e mostrando "N/A" no card. Adicionado `stickerObtainedAt: Record<stickerId, ISOString>` no documento do usuário (gravado via update com dot-notation em todo ponto que concede figurinha); `GetUserProfile` sobrepõe essa data por cima do `obtainedAt` vazio do catálogo antes de ordenar.

**Bug — progresso do Mercado sempre `0/100`**: `getMarketAlbums()` nunca recebeu `userId`, e o catálogo SQLite sempre devolve `ownedStickersCount: 0` (dado estático). A interface `AlbumRepository.getMarketAlbums` ganhou o parâmetro `userId`; `FirestoreAlbumRepository` agora cruza `collection.stickerIds` com o `albumId` de cada figurinha do catálogo pra calcular a contagem real por álbum.

**Robustez da UI — tela de abertura de pacote travando sem nenhuma ação possível**: dois problemas distintos, mesmo sintoma.
1. `IdlePackCard.handlePress` (`AnimacaoAbrirPacote.tsx`) desabilitava o botão (`bursting=true`, sem reset) e dependia do callback de conclusão de uma animação Reanimated (`withTiming(..., (finished) => runOnJS(onStartReveal)())`) pra disparar a transição de negócio pro reveal. Se esse callback não disparasse (interrupção da animação, hiccup da ponte UI↔JS thread), a tela ficava travada permanentemente. Trocado por `setTimeout` no JS thread, desacoplando a lógica de negócio da animação decorativa.
2. O card de revelação usava altura fixa (`CARD_WIDTH * 1.4`, ≈105% da largura da tela) que, somada ao cabeçalho/contador/dots/gap, ultrapassava a altura de telas menores — empurrando o botão "PRÓXIMA"/"CONCLUIR" pra fora da viewport, sem `ScrollView` pra alcançá-lo. Corrigido com altura máxima relativa à tela (`SCREEN_HEIGHT * 0.48`) + `ScrollView` como rede de segurança.

**`ProfileScreen` — cards de figurinha sem estilo visual**: as seções "Recentes"/"Raras" renderizavam texto cru (`Sticker {id}` + badge de raridade) em vez do componente `CardFigurinha` (imagem, nome, raridade, data) já usado no resto do app. Corrigido.

**`HomeScreen` — botão "Dar Palpite" sem ação**: o `ContainerAposta` renderizado no card de partida em destaque da Home não recebia a prop `onPress`, caindo no fallback de `console.log` em vez de navegar para `/palpite/[matchId]` (comportamento já correto em `ApostasScreen`). Corrigido.

**Gotcha de compatibilidade — Expo Router SDK 56 vs `@react-navigation/native`**: a partir do SDK 56, `expo-router` não é mais compatível com importações diretas de `@react-navigation/native` — mesmo sendo uma dependência transitiva já presente no projeto (`react-native-screens`/navegação interna), importar `useFocusEffect` de lá quebra o bundler Android com `As of SDK 56, expo-router is no longer compatible with react-navigation`. `expo-router` re-exporta os hooks equivalentes (`useFocusEffect`, `useIsFocused`) — **sempre importar de `expo-router`, nunca de `@react-navigation/native` diretamente**, mesmo que o pacote esteja instalado.

**Limpeza — `MockAlbumRepository` removido**: confirmado sem nenhum import fora do próprio arquivo (`repositoryInstance.ts` já injetava só `FirestoreAlbumRepository` + `SQLiteAlbumCatalogRepository`) — dead code desde a migração pro Firestore. Removido junto com `mockUserCollection` (export de `AlbumSeed.ts` usado só pelo Mock). `mockAlbums`/`mockStickers` do mesmo arquivo **permanecem** — apesar do nome, são a fonte real de seed do catálogo SQLite (`shared/infra/sqlite/migrations/001_initial.ts`), não dado de um repositório mock.

### 9.8 Fase 5 (Tela Home definitiva) marcada como obsoleta

> Registrado em 07/2026.

A Fase 5 do grafo original planejava uma "Tela Home definitiva" com dois componentes novos — `MoldeCardHome` (card maior para partida em destaque) e `CardPartida` (card compacto de partida) — que substituiriam o hub provisório da `HomeScreen` (ver seção 9.1).

Essa substituição foi avaliada e **descartada**: a `HomeScreen` atual (`src/shared/presentation/screens/HomeScreen.tsx`) já cumpre integralmente o papel da Home definitiva — exibe a partida em destaque reutilizando `ContainerAposta` (feature `apostas`), navegação para Times/Grupos e o card de coleção (`CardColecao`, feature `album`/shared) — sem necessidade de dois componentes exclusivos e redundantes com o que já existe.

- Fase 5, como definida originalmente, está **obsoleta** — não será implementada.
- `MoldeCardHome` e `CardPartida` não serão criados; a tabela da seção 9.2 reflete esse status.
- A `HomeScreen` é considerada a versão definitiva da Home a partir deste registro.

### 9.9 `tsc --noEmit` limpo pela primeira vez + cobertura de testes na camada Presentation

> Registrado em 07/2026. Detalhes completos em [docs/testing-plan.md](testing-plan.md) (Fases 4–6).

O typecheck do projeto nunca tinha passado limpo — 19 erros persistiam desde antes da Fase 3.5 (que já havia corrigido um problema de tipos de teste diferente, ver seção correspondente no testing-plan). Causas e correções:

- **`firebase/firestore` sem `.d.ts` (7 erros)**: bug de empacotamento do `firebase@12.16.0` — o campo `types` do subpath export `./firestore` aponta para um arquivo que não existe no pacote publicado (`firebase/auth` não tem esse problema). Contornado com um `paths` no `tsconfig.json` redirecionando para os tipos reais de `@firebase/firestore` (dependência transitiva já presente).
- **Tipos de rota do `expo-router` desatualizados (11 erros)**: `.expo/types/router.d.ts` — arquivo gerado e gitignored — não conhecia as rotas de `app/(auth)/`. Regenerado subindo o dev server. **Isso significa que um checkout novo do zero volta a ter esses 11 erros até rodar `npx expo start` uma vez** — não há como versionar a correção, é inerente a como o Expo Router gera tipos.
- **`scripts/seedFirestoreUser.ts` importava a service account como módulo (1 erro)**: `import serviceAccount from './serviceAccountKey.json'` nunca compilaria num checkout limpo, já que o arquivo é gitignored por conter credenciais. Trocado por leitura em runtime (`readFileSync`).

Na mesma sessão, a camada `presentation/hooks` e boa parte de `presentation/components` (antes 0% cobertas — inclusive excluídas do `collectCoverageFrom` do Jest) ganharam testes, incluindo o `UserContext`/`AuthGuard` e os use cases de delegação pura restantes. Dois bugs reais de lint (`react-hooks/refs` em `useSettlePendingPredictions`, `react-hooks/purity` no sorteio de partículas de `AnimacaoAbrirPacote`) foram corrigidos de fato; os demais 15 avisos de `react-hooks/set-state-in-effect` (regra experimental "React Compiler" que rejeita o padrão `fetch-on-mount` recomendado pelos próprios docs do React) foram suprimidos com comentário justificado — decisão tomada com o usuário para não introduzir uma reescrita arquitetural do data-fetching apenas para satisfazer uma regra experimental.

### 9.10 Bandeiras 100% via CDN (SVG removido do projeto) + espaço fantasma da `MenuBar`

> Registrado em 08/2026, a partir de dois bugs de interface reportados em teste manual.

**Bandeira do Brasil renderizando errado.** `assets/flags/br.svg` era o único dos 9 SVGs que não seguia o padrão dos outros (máscara circular + bandeira em tamanho cheio): desenhava um círculo verde direto e tinha uma "faixa branca" feita à mão que não fechava. Isso expôs o problema de fundo — o app tinha **dois caminhos** para a mesma coisa: 9 bandeiras como SVG local (`flagMap.ts`) e as outras 39 pelo `flagcdn.com`, com o SVG tendo prioridade. Manter 48 SVGs à mão não escala, e o dado já trazia a URL do CDN (`flagUrl` em `database/teams.ts`) desde a migração para o SQLite.

Decisão: **um caminho só, o CDN.** Removidos `assets/flags/` (9 arquivos), `src/shared/presentation/utils/flagMap.ts` e o ramo `FlagComponent` do `MolduraIndividualPais` — que hoje só normaliza o `teamId`, traduz ISO-3→ISO-2 pelo `countryCodeMap` e monta `https://flagcdn.com/w160/<iso2>.png` num `expo-image`. O `countryCodeMap` continua sendo necessário (ids de time como `t1`/`bra` não são códigos ISO-2), e as sub-regiões (`sco`→`gb-sct`, `eng`→`gb-eng`) já eram servidas pelo CDN.

Como nenhum `import ... from '*.svg'` sobrou, todo o encanamento de SVG saiu junto: as dependências **`react-native-svg` e `react-native-svg-transformer`**, o `babelTransformerPath`/remanejamento de `assetExts` do [metro.config.js](../metro.config.js) (voltou a ser o `getDefaultConfig` puro), o `moduleNameMapper` de `\.svg$` no [jest.config.js](../jest.config.js), o `test/svgMock.tsx` e o bloco `declare module '*.svg'` do [declarations.d.ts](../src/declarations.d.ts).

> **Consequência a ter em mente**: bandeira agora depende de rede. Offline (ou no primeiro load sem cache do `expo-image`), o círculo aparece vazio com o fundo `#333` do container. Antes, as 9 seleções com SVG local apareciam sempre. Trocamos disponibilidade offline de 9 bandeiras por consistência nas 48 — se offline virar requisito, o caminho é *bundle* de imagens ou cache persistente do `expo-image`, não voltar aos SVGs.

**Espaço fixo entre a topbar e o conteúdo.** A `MenuBar` usava `<SafeAreaView>` (do `react-native-safe-area-context`) **sem a prop `edges`** — cujo default é `['top','right','bottom','left']`. Como ela é montada no topo da tela, o inset *inferior* virava um padding da cor de fundo logo abaixo da borda verde: um vão fixo, fora do scroll, em todas as telas de tab. Corrigido com `edges={['top']}`.

Na mesma correção saiu o `paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0` do mesmo componente: com `edges={['top']}`, o próprio safe-area-context já aplica a altura da status bar no Android, então os dois somados dobravam o espaço acima do logo.

> **Regra que fica**: `SafeAreaView` sempre com `edges` explícito, listando só as bordas que aquele componente realmente encosta. O default silencioso de quatro bordas é a origem do bug, e ele não aparece em teste unitário — só no device.

### 9.11 Palpites no Firestore e fim dos repositórios Mock

> Registrado em 08/2026. Testes correspondentes na Fase 7 do [testing-plan.md](testing-plan.md).

**O problema.** Os palpites eram a última coisa do app sem persistência: `MockPredictionRepository` guardava tudo num array de instância, com seed em código e `setTimeout` de 200–400ms simulando rede. Na prática, o usuário dava um palpite, o app confirmava, e **o palpite sumia no reload** — junto com qualquer recompensa que o settlement tivesse concedido. Como esse Mock era o repositório real injetado pelo `repositoryInstance.ts`, o nome "Mock" escondia o defeito: parecia um double de teste esquecido, mas era produção.

**`FirestorePredictionRepository`**, na coleção raiz `predictions` — um documento por palpite, com `userId` como campo:

```
/predictions/{predictionId}
  { userId, matchId, predictedHomeScore, predictedAwayScore, reward, status, createdAt }
```

Raiz e não subcoleção de `users` por um motivo de contrato: `PredictionRepository.updatePredictionStatus(predictionId, status)` **não recebe `userId`** — numa subcoleção seria impossível montar a referência do documento sem mudar a interface do domínio (e, por tabela, o use case de settlement e os testes dele). A coleção raiz resolve com `doc(db, 'predictions', predictionId)` direto.

Duas decisões menores que valem registro:
- **O id passou a ser gerado pelo Firestore** (`addDoc`), não mais pelo relógio (`pred_${Date.now()}`). Ids por timestamp colidem se dois palpites forem criados no mesmo milissegundo.
- **A ordenação do histórico é feita no cliente**, não com `orderBy` na query. `where('userId')` + `orderBy('createdAt')` são campos diferentes e exigiriam um índice composto no Firestore; o volume de palpites por usuário não justifica isso. `computePredictionStats` (a função pura extraída na Fase 3.5) continua sendo quem calcula `successRate`/`totalPoints`.

**Limpeza junto.** Com a migração, `MockPredictionRepository` e `PredictionSeed.ts` saíram — e, na mesma passada, os três repositórios Mock que já estavam mortos desde a migração para SQLite (`MockGroupRepository`, `MockTeamRepository`, `MockMatchRepository`), mais os seeds que só eles consumiam (`GroupSeed`, `TeamSeed`, `PlayerSeed`, `MatchSeed`). **Não há mais nenhum repositório Mock no projeto**, e a seção 1 deixou de precisar da ressalva sobre latência simulada.

> **Consequência: o histórico de palpites nasce vazio.** Os 9 palpites de demonstração viviam no `PredictionSeed.ts`, inclusive o `pred_9` pendente sobre a partida `m9` (finalizada) que tornava o settlement observável sem esforço — ver seção 9.6. Como dado de usuário não tem seed em código, esses palpites de demonstração passaram para [scripts/seedFirestoreUser.ts](../scripts/seedFirestoreUser.ts), que agora cria dois palpites junto com o usuário de exemplo: um sobre `m9` (vira vitória no primeiro settlement) e um sobre `m1` (segue pendente). Quem não rodar o script vê a Tela Histórico vazia até palpitar — comportamento correto, mas diferente do que era antes.

---

## 10. Arquitetura de Dados (Nuvem vs Local)

O aplicativo divide o armazenamento de dados visando otimização extrema de performance, redução de latência e diminuição de custos (reads/writes) no banco em nuvem.

### Regra de Ouro

| Critério | Solução de Armazenamento | Exemplos |
|---|---|---|
| **Dado estático**, igual para todos os usuários, que não muda durante o projeto | **SQLite local** | Tabela de países/seleções, configurações globais padrão, regras do jogo, estrutura fixa dos pacotes |
| **Dado mutável ou pessoal**, pertence a um usuário específico ou muda frequentemente | **Firestore (nuvem)** | Progresso do álbum, figurinhas possuídas, quantidade de moedas, histórico de palpites, dados da conta |

### Observações sobre a Implementação do Firestore

Foi identificado um comportamento atípico do Firebase Web SDK (v12) em projetos com bases de dados que utilizam IDs nomeados ou foram provisionados de forma genérica.
- **Sintoma:** O SDK retornava `Database '(default)' not found`.
- **Causa:** O banco de dados no Google Cloud estava nomeado literalmente como `default` e não `(default)` (com parênteses), que é a norma tradicional.
- **Solução:** No arquivo `src/shared/infra/firebase/firebaseConfig.ts`, o `databaseId` foi especificado **explicitamente** como o terceiro parâmetro: `initializeFirestore(app, {...}, 'default')` e no fallback `getFirestore(app, 'default')`.
Isso solucionou definitivamente os falsos erros de `404 Not Found` na comunicação interna do Firebase.

### Implementação Híbrida do SQLite Local

Toda a carga estática foi migrada para o **SQLite** no aparelho — **48 seleções**, **1363 jogadores** (1256 de campo + 59 especiais + 48 escudos), **12 grupos** (A–L), **72 partidas** da fase de grupos com placares calculados e standings finais, **2 álbuns** e **150 figurinhas** de catálogo (100 no `a1`, 50 no `a2`). A fonte versionada é `database/` (times, jogadores, partidas geradas por round-robin) mais `album/infra/seed/AlbumSeed.ts` (álbuns e figurinhas):
1. **Migrations e Versionamento**: A inicialização é feita no Root Layout (`app/_layout.tsx`) sob o `<SQLiteProvider>` com a migration `001_initial.ts`. A persistência física evita recriações usando `PRAGMA user_version = 1;` e comandos `IF NOT EXISTS` / `INSERT OR IGNORE`.
2. **Conexão Isolada**: Um utilitário de persistência (`src/shared/infra/sqlite/database.ts`) encapsula a conexão SQLite assincronamente como singleton fora do ciclo do React, respeitando o desacoplamento de infra na Clean Architecture.
3. **Resolução de Tipagem**: Os repositórios da camada de Infra realizam a tradução exata do schema relacional do banco local para as interfaces tipadas de domínio do app.
