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
  _layout.tsx           → RootLayout: <UserProvider><Stack>
                            Stack.Screen "(tabs)"              headerShown: false
                            Stack.Screen "grupos"               presentation: modal
                            Stack.Screen "apostas"               presentation: modal
                            Stack.Screen "mercado/[albumId]"     → Tela Compra Coleção
                            Stack.Screen "figurinha/[stickerId]" → Tela Compra Figurinha Individual
                            Stack.Screen "figurinhas"            → Tela Todas as Figurinhas
  apostas.tsx           → modal de apostas
  grupos.tsx            → modal de grupos
  mercado.tsx           → Tela Mercado de Figurinhas
  mercado/[albumId].tsx → Tela Compra Coleção (grid de figurinhas de um álbum)
  figurinha/[stickerId].tsx → Tela Compra Figurinha Individual
  figurinhas.tsx        → Tela Todas as Figurinhas (catálogo por raridade)
  (tabs)/
    _layout.tsx     → TabsLayout: header={() => <CustomHeader />}
                        tabBarStyle: background #1E1E24, sem borda
                        activeTintColor: colors.primary (#B4FF00)
    index.tsx       → HomeScreen (definitiva — Fase 5 original obsoleta, ver seção 9.8)
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

```
app/
│   _layout.tsx           ← Root Stack (UserProvider + Stack global)
│   apostas.tsx           → ApostasScreen
│   grupos.tsx            → GroupsScreen
│   mercado.tsx           → TelaMercado
│   mercado/[albumId].tsx → TelaCompraColecao
│   figurinha/[stickerId].tsx → TelaCompraFigurinha
│   figurinhas.tsx        → TelaTodasFigurinhas
│   (auth)/               ← Rotas de Autenticação (públicas)
│       _layout.tsx       ← Stack modal
│       entrar.tsx        → TelaEntrar
│       cadastro.tsx      → TelaCadastro
│       esqueci-senha.tsx → TelaEsqueciSenha
│   (tabs)/               ← Rotas Principais (públicas e privadas controladas)
│       _layout.tsx       ← Tabs + CustomHeader
│       index.tsx         → HomeScreen (definitiva, ver seção 9.8)
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
      screens/            → HomeScreen (definitiva, ver seção 9.8)
      theme/              → colors, typography, spacing, radius

  features/
    grupos/               → Group, GroupStanding | GetAllGroups | GroupsScreen
    times/                → Team, Player | SearchTeams, ToggleFavorite | TimesScreen + SearchInput
                            [pronto] Tela Time (CardConquistas, MoldeJogadores)
                                     Tela Jogador (CardCaracterísticas)
    album/                → Sticker, UserCollection | GetUserProfile, OpenPackage
                            → ProfileScreen + CardColeção
                            [pronto] Mercado de Figurinhas (CompartilhBtn)
                                     Animação Abrir Pacote
                                     Tela Compra Coleção (StickerCard, por álbum)
                                     Tela Compra Figurinha Individual (BuyIndividualSticker)
                                     Tela Todas as Figurinhas (agrupada por raridade)
    apostas/              → Match, Prediction | GetUpcomingMatches, CreatePrediction
                            → ApostasScreen + ContainerAposta + BotaoHistorico
                            [pronto] Tela Palpite
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

> `CustomHeader` já está implementado como componente global em `src/shared/presentation/components/CustomHeader.tsx`.

---

## 5. Features Implementadas

### `grupos` — ✅ Completo (Fase 1)

- **Domain**: `Group { id, name, standings: GroupStanding[] }` · `GroupStanding { teamId, points, wins, draws, losses, goalDifference }`
- **Use Case**: `GetAllGroups.execute()` → `Group[]`
- **Infra**: `MockGroupRepository` com seed de 2 grupos e standings ranqueados por pontos
- **Presentation**: `GroupsScreen` via `useGroups` · Rota: `/grupos` (modal)

### `times` — ✅ Fases 1, 2 e 3 completas

- **Domain**: `Team`, `Player`, `PlayerStats` · `TeamRepository`: `getAll`, `getFavorites`, `toggleFavorite`, `search`, `getTeamById`, `getPlayersByTeamId`, `getPlayerById`
- **Use Cases**: `GetFavoriteTeams`, `SearchTeams`, `ToggleFavoriteTeam`, `GetTeamById`, `GetPlayerById`
- **Infra**: `MockTeamRepository` com estado mutável em memória · 9 seleções no seed
- **Presentation (✅)**: `TimesScreen` — grid de 2 colunas com bandeira (`MolduraIndividualPais`), ranking e estrela de favorito por card; `SearchInput` (debounce 500ms); seção "Meus Times" acima da lista completa quando logado, via `useTimesScreen`
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
- **Infra**: `MockMatchRepository` filtra por `status === 'scheduled'` em `getUpcomingMatches` e expõe `getMatchById` para o settlement · `MockPredictionRepository` ganhou `updatePredictionStatus` · seed com 5 partidas (4 agendadas + 1 `finished` para demonstrar o settlement)
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
- Fora de escopo, por decisão consciente: refatorar os cards já existentes na `ProfileScreen`/`TelaMercado` para usar o novo `StickerCard`; corrigir o cálculo de progresso hardcoded em `openPackage`/`buyStickerPack` (que sempre usa `mockAlbums[0]`); adicionar uma 4ª aba "Mercado" na bottom nav (o Figma tem 4 abas — Home/Mercado/Perfil/Times — mas o código tem 3, com Mercado como modal).

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

**Tela Times redesenhada**: ver seção 5 (`times`) — de lista de texto (`SectionList`) para grid 2 colunas com bandeira SVG.

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

Toda a carga estática (48 seleções, mais de 300 jogadores, 2 álbuns, 150 figurinhas de catálogo e 72 partidas com placares calculados e standings finais da fase de grupos) foi migrada para o **SQLite** no aparelho:
1. **Migrations e Versionamento**: A inicialização é feita no Root Layout (`app/_layout.tsx`) sob o `<SQLiteProvider>` com a migration `001_initial.ts`. A persistência física evita recriações usando `PRAGMA user_version = 1;` e comandos `IF NOT EXISTS` / `INSERT OR IGNORE`.
2. **Conexão Isolada**: Um utilitário de persistência (`src/shared/infra/sqlite/database.ts`) encapsula a conexão SQLite assincronamente como singleton fora do ciclo do React, respeitando o desacoplamento de infra na Clean Architecture.
3. **Resolução de Tipagem**: Os repositórios da camada de Infra realizam a tradução exata do schema relacional do banco local para as interfaces tipadas de domínio do app.
