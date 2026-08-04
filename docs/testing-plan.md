# Plano de Testes Unitários — Jest

Documento de referência e estudo para a implantação de testes unitários no projeto. Descreve a estratégia, a configuração e o plano faseado de implementação. Cada fase é marcada como concluída conforme avança.

---

## Por que começar pelo Domain

O projeto segue Clean Architecture ([technical-readme.md](technical-readme.md)), então a lógica de negócio fica isolada em `domain/`, sem nenhuma dependência de React Native, Expo ou banco de dados. Isso torna essa camada a mais barata de testar (nenhum mock de módulo nativo) e a mais valiosa (é onde as regras do app vivem).

Mapeando os use cases existentes, um padrão ficou claro: a maioria é **delegação pura de uma linha** para o repositório — por exemplo:

```ts
// AddUserCoins.ts
export class AddUserCoins {
  constructor(private readonly albumRepository: AlbumRepository) {}
  async execute(userId: string, amount: number) {
    return this.albumRepository.addUserCoins(userId, amount);
  }
}
```

Não há lógica para quebrar aqui — só uma chamada repassada. A lógica de negócio real está concentrada em três lugares:

| Arquivo | Lógica |
|---|---|
| [rewards.ts](../src/features/album/domain/constants/rewards.ts) | Cálculo de cooldown de recompensa diária (`computeDailyClaimStatus` e derivadas) |
| [SettlePendingPredictions.ts](../src/features/apostas/domain/usecases/SettlePendingPredictions.ts) | Filtra pendentes, compara placar, decide vitória/derrota, concede recompensa |
| [GetUserProfile.ts](../src/features/album/domain/usecases/GetUserProfile.ts) | Mescla `obtainedAt`, ordena por data, filtra raras, corta os 10 mais recentes |

**Estratégia:** cobertura completa de casos nesses três pontos; nos demais use cases (delegação pura), um teste de contrato rápido — "chama o repositório certo com os argumentos certos" — que serve de rede de segurança caso a lógica cresça depois. É aí que a quantidade de testes varia conforme o tempo disponível, sem risco arquitetural.

> **Revisão posterior (Fase 8).** Nem toda delegação de uma linha era ausência de regra: `BuyStickerPack` e `BuyIndividualSticker` eram de uma linha porque a regra deles estava na camada errada, dentro do `FirestoreAlbumRepository`. Depois de movida para o use case, cada um passou a ter 8–9 testes de comportamento. O sinal de alerta: um use case que leva o nome de uma operação e não contém nenhuma decisão dela.

---

## Fase 1 — Infraestrutura de testes ✅ concluída

- [x] Instalar dependências de teste (dev):
  ```bash
  npx expo install jest-expo jest @types/jest --dev
  npm install --save-dev @testing-library/react-native react-test-renderer
  ```
  > `react-test-renderer` foi fixado em `19.2.3` para bater com a versão exata do `react` instalado (peer dependency estrita) — sem isso o `npm install` falha com `ERESOLVE`.
- [x] Criar `jest.config.js` na raiz com `preset: 'jest-expo'` e `moduleNameMapper` replicando os paths do [tsconfig.json](../tsconfig.json) (`@/*` → `src/*`, `@/assets/*` → `assets/*`)
- [x] Adicionar scripts `test`, `test:watch`, `test:coverage` no `package.json`
- [x] Teste de fumaça em `computeDailyClaimStatus` para validar a pipeline (TS + preset + resolução de módulos) antes de escalar

**Convenção de arquivos:** teste ao lado do arquivo original (`Foo.ts` → `Foo.test.ts`). O `testMatch` padrão do Jest já reconhece isso, sem config extra.

> **Revisão posterior (Fase 9).** `domain/usecases` e `infra/repositories` deixaram de ser co-localizados e passaram para `src/features/<feature>/test/`, espelhando a estrutura de camadas. Hooks, componentes, `domain/constants` e `main/factories` seguem co-localizados. Ver a Fase 9, no fim deste documento.

---

## Fase 2 — Domain: regras de negócio puras ✅ concluída

- [x] `rewards.ts`: nunca resgatado, exatamente no limite do cooldown, antes do cooldown, depois do cooldown — para os dois cooldowns (moedas diárias e pacote grátis) → [rewards.test.ts](../src/features/album/domain/constants/rewards.test.ts)
- [x] `SettlePendingPredictions`: ignora predição não-pendente; ignora partida não finalizada/sem placar; acerta vitória (placar bate) e derrota (não bate); concede `coins` vs `stickers` conforme o tipo de recompensa; atualiza o status → [SettlePendingPredictions.test.ts](../src/features/apostas/test/domain/usecases/SettlePendingPredictions.test.ts)
  > Ramo descoberto encontrado depois, via *branch coverage*: recompensa vencedora malformada (`type: 'sticker'` sem `stickerIds`, ou `type: 'coins'` sem `coinAmount`) cai fora dos dois `if` — o palpite é marcado como `won` e **nenhuma recompensa é concedida**, sem erro nem log. O teste `'marca como vencedora mas não concede nada quando a recompensa está malformada'` documenta o comportamento atual e fecha o ramo. As métricas de statements/lines/functions já estavam em 100% e não apontavam para isso.
- [x] `GetUserProfile`: usa `stickerObtainedAt` do usuário quando existe (fallback pro catálogo); ordena `recentStickers` por data desc; filtra `rara`/`lendaria`; corta em 10 recentes → [GetUserProfile.test.ts](../src/features/album/test/domain/usecases/GetUserProfile.test.ts)
  > Pegadinha encontrada durante os testes: o campo `stickers` retornado **não** é ordenado — só `recentStickers`/`rareStickers` usam a lista ordenada internamente. Um teste ingênuo que assume `stickers` ordenado falha; vale como exemplo de como o teste também documenta o comportamento real do código.
- [x] 5 testes de contrato (um por feature) para o padrão de delegação pura:
  - `album` → [BuyStickerPack.test.ts](../src/features/album/test/domain/usecases/BuyStickerPack.test.ts) — *deixou de ser teste de contrato na Fase 8, quando as regras de compra voltaram para o use case*
  - `apostas` → [CreatePrediction.test.ts](../src/features/apostas/test/domain/usecases/CreatePrediction.test.ts)
  - `times` → [ToggleFavoriteTeam.test.ts](../src/features/times/test/domain/usecases/ToggleFavoriteTeam.test.ts)
  - `grupos` → [GetAllGroups.test.ts](../src/features/grupos/test/domain/usecases/GetAllGroups.test.ts)
  - `auth` → [makeAuth.test.ts](../src/features/auth/main/factories/makeAuth.test.ts) — feature sem `domain/usecases` (as factories chamam o repositório direto), então o teste mocka o módulo `repositoryInstance` em vez de injetar um mock por construtor. Padrão diferente, mesmo objetivo.

**Mocks:** como os repositórios são interfaces TypeScript, os testes usam objetos simples com `jest.fn()` por método — nenhum setup de React Native é necessário nesta fase.

**Resultado:** 8 suítes, 23 testes, todos passando (`npm test`).

---

## Fase 3 — Infra: repositórios (SQLite / Firestore mockados) ✅ concluída

Sem banco real em ambiente Node — a estratégia é mockar o ponto de acesso ao driver (não o repositório inteiro), validando mapeamento linha→entidade e montagem de queries:

- [x] `jest.mock` em [database.ts](../src/shared/infra/sqlite/database.ts) (`getSQLiteDb`), retornando um fake com `getFirstAsync`/`getAllAsync` como `jest.fn()`
- [x] Exemplo completo: [SQLiteAlbumCatalogRepository.ts](../src/features/album/infra/repositories/SQLiteAlbumCatalogRepository.ts) → [SQLiteAlbumCatalogRepository.test.ts](../src/features/album/test/infra/repositories/SQLiteAlbumCatalogRepository.test.ts) — `getAlbumById` (mapeia e lança erro quando não encontra), `getMarketAlbums`, `getStickersByIds` (early-return em array vazio, conversão `null`→`undefined`, cast de `rarity`, placeholders `IN (?,?,...)`), `getStickersByAlbumId`, `getAllStickers`
- [x] Repositório Firebase Auth: [FirebaseAuthRepository.ts](../src/features/auth/infra/repositories/FirebaseAuthRepository.ts) → [FirebaseAuthRepository.test.ts](../src/features/auth/test/infra/repositories/FirebaseAuthRepository.test.ts) — mocka `firebase/auth`, `firebase/firestore` **e** o módulo `firebaseConfig` (senão o import real dispara a validação de variáveis de ambiente e tenta inicializar o Firebase de verdade)
- [x] [SQLiteTeamRepository.ts](../src/features/times/infra/repositories/SQLiteTeamRepository.ts) → [SQLiteTeamRepository.test.ts](../src/features/times/test/infra/repositories/SQLiteTeamRepository.test.ts) — mocka SQLite **e** Firestore (favoritos ficam no Firestore, elenco no SQLite) + `../../domain/constants/playerStats` (pra não depender de `Math.random` real neste nível). Inclui o caso do `try/catch` que engole erro do Firestore e devolve `[]` em vez de propagar
- [x] [SQLiteMatchRepository.ts](../src/features/apostas/infra/repositories/SQLiteMatchRepository.ts) → [SQLiteMatchRepository.test.ts](../src/features/apostas/test/infra/repositories/SQLiteMatchRepository.test.ts) — odds só aparecem em partidas `scheduled`; placar só aparece em `finished`
- [x] [SQLiteGroupRepository.ts](../src/features/grupos/infra/repositories/SQLiteGroupRepository.ts) → [SQLiteGroupRepository.test.ts](../src/features/grupos/test/infra/repositories/SQLiteGroupRepository.test.ts) — `getAllGroups` faz N+1 queries (uma por grupo pros standings); mock usa `mockResolvedValueOnce` encadeado pra simular cada chamada em sequência
- [x] [FirestoreAlbumRepository.ts](../src/features/album/infra/repositories/FirestoreAlbumRepository.ts) → [FirestoreAlbumRepository.test.ts](../src/features/album/test/infra/repositories/FirestoreAlbumRepository.test.ts) — o mais complexo: `catalogRepository` (dependência concreta, não interface) é substituído por um objeto `jest.fn()` via `as unknown as jest.Mocked<SQLiteAlbumCatalogRepository>` (contorna o `private` da classe real, que quebraria a checagem estrutural do TS). Cobre as guardas de erro (saldo insuficiente, recompensa/pacote ainda não disponível, figurinha inexistente), `ensureUserDoc` (cria vs. reaproveita o doc) e o cruzamento de dados Firestore+SQLite em `getMarketAlbums`. Como o mock do Firestore não simula estado real, os testes verificam a *chamada* a `updateDoc` (o quê foi gravado), não uma releitura pós-gravação

Repositórios Mock em memória (`MockTeamRepository`, `MockGroupRepository`, `MockPredictionRepository`) já são fakes — baixa prioridade, deixados de fora.

> **Revisão posterior (Fase 7).** Essa avaliação estava certa para dois dos três e errada para o terceiro: `MockTeamRepository` e `MockGroupRepository` eram mesmo dead code (removidos), mas `MockPredictionRepository` era o repositório **de produção** dos palpites. "Deixar de fora por ser fake" só é seguro depois de conferir quem o `repositoryInstance.ts` da feature injeta.

**Resultado:** 19 suítes, 105 testes, todos passando (`npm test`), `tsc --noEmit` limpo.

---

## Fase 3.5 — Extrair regra de negócio dos repositórios de infra ✅ concluída

Ao tentar testar o `FirestoreAlbumRepository` na Fase 3, ficou claro que ele mistura regra de negócio (sorteio, cálculo de progresso) com chamadas Firestore no mesmo método — intestável sem mockar `Math.random` numa cadeia grande de `getDoc`/`updateDoc`. Levantando os outros repositórios de infra, o mesmo defeito apareceu em mais lugares, em graus variados. Extraímos tudo para funções puras em `domain/constants/` (mesmo padrão do `rewards.ts`: parâmetros injetáveis como `random: () => number = Math.random` no lugar do não-determinismo direto), testamos essas funções isoladamente, e os repositórios passaram só a chamá-las. **Refatoração pura — nenhum comportamento observável do app mudou.**

- [x] `computeWinRate` — [ranking.ts](../src/features/times/domain/constants/ranking.ts) — substituiu 4 cópias idênticas da fórmula em [SQLiteTeamRepository.ts](../src/features/times/infra/repositories/SQLiteTeamRepository.ts)
- [x] `generatePlayerStats` — [playerStats.ts](../src/features/times/domain/constants/playerStats.ts) — o pior caso encontrado: gerava gols/assistências/jogos com `Math.random()` direto dentro de um mapper de linha→entidade. Agora recebe `random` injetável e é 100% testável
- [x] `computeMatchOdds` — [odds.ts](../src/features/apostas/domain/constants/odds.ts) — já era determinístico (hash do id da partida), só não estava extraído; testado com valores exatos conhecidos
- [x] `computeCollectionProgress`, `drawUnownedStickers`, `drawStickersWithRepetition` — [collection.ts](../src/features/album/domain/constants/collection.ts) — o cálculo de progresso estava duplicado **5 vezes** dentro do `FirestoreAlbumRepository`; os dois algoritmos de sorteio (sem repetição / com repetição, usados em fluxos diferentes) também saíram de lá
- [x] `computePredictionStats` — [predictionStats.ts](../src/features/apostas/domain/constants/predictionStats.ts) — extraído do `MockPredictionRepository`. Importante: esse Mock era o repositório real em produção à época (`repositoryInstance.ts` da feature `apostas` usava `MockPredictionRepository`, não SQLite), não só um double de teste
  > **Atualização (Fase 7).** O Mock foi substituído pelo `FirestorePredictionRepository` e removido. A função pura sobreviveu intacta à troca de banco — e é exatamente esse o retorno da extração: `computePredictionStats` e seus testes não foram tocados na migração.

**Bug de tooling encontrado no caminho:** `tsc --noEmit` nunca tinha sido rodado no projeto (só `expo lint`, que é ESLint, roda no CI/scripts). Descobrimos que `describe`/`it`/`expect`/`jest` estavam **todos** com erro de tipo em todo arquivo de teste desde a Fase 1 — mascarado porque `npm test` usa Babel (não type-checa). Duas causas, duas correções:
1. Sem `"types": ["jest"]` no [tsconfig.json](../tsconfig.json), o TypeScript não carregava `@types/jest` (mesmo estando instalado) — corrigido adicionando essa linha.
2. `@types/jest` declara `jest` como **namespace de tipos** (`jest.Mock`), não como valor global — `jest.fn()`/`jest.mock()` davam erro "Cannot use namespace as a value". Corrigido instalando `@jest/globals` (que já era dependência transitiva) e mesclando o tipo no global scope via [declarations.d.ts](../src/declarations.d.ts).

Depois das duas correções: `npx tsc --noEmit` limpo, zero erros no projeto inteiro.

**Resultado:** 15 suítes, 64 testes, todos passando (`npm test`), mais `tsc --noEmit` limpo.

---

## Fase 4 — Presentation: hooks ✅ concluída

Setup: `renderHook`/`act`/`waitFor` do `@testing-library/react-native`, mockando o módulo de factory de cada hook (`jest.mock('../../main/factories/makeX')`) e o `UserContext` (`jest.mock('.../contexts/UserContext')`) quando o hook depende de `useCurrentUser`/`useRefreshCoins`.

- [x] **auth** (motivador original desta fase — "falta autenticação"): [useLogin.test.ts](../src/features/auth/presentation/hooks/useLogin.test.ts), [useRegister.test.ts](../src/features/auth/presentation/hooks/useRegister.test.ts), [useForgotPassword.test.ts](../src/features/auth/presentation/hooks/useForgotPassword.test.ts) — cobertura completa da tradução de cada `code` de erro do Firebase para mensagem em pt-BR, fallback genérico (erro sem `code`, string, `null`, `undefined`), estado de `loading` pendente, limpeza do erro anterior numa nova tentativa
- [x] **album** (10 hooks + o store): [useUserProfile](../src/features/album/presentation/hooks/useUserProfile.test.ts), [useAllStickers](../src/features/album/presentation/hooks/useAllStickers.test.ts) (agrupamento por raridade, `ownedIds` como `Set`), [useAlbumStickers](../src/features/album/presentation/hooks/useAlbumStickers.test.ts), [useMarketAlbums](../src/features/album/presentation/hooks/useMarketAlbums.test.ts), [useStickerDetail](../src/features/album/presentation/hooks/useStickerDetail.test.ts), [useBuyStickerPack](../src/features/album/presentation/hooks/useBuyStickerPack.test.ts) (grava no `pendingPackStore`, chama `refreshCoins`), [useBuyIndividualSticker](../src/features/album/presentation/hooks/useBuyIndividualSticker.test.ts), [useAbrirPacote](../src/features/album/presentation/hooks/useAbrirPacote.test.ts) (lê do `pendingPackStore` antes de sortear de novo — cobre o bug de double-draw da seção 9.7 do [technical-readme.md](technical-readme.md)), [useDailyCoinsReward](../src/features/album/presentation/hooks/useDailyCoinsReward.test.ts), [useFreePackage](../src/features/album/presentation/hooks/useFreePackage.test.ts) + [pendingPackStore.test.ts](../src/features/album/infra/stores/pendingPackStore.test.ts)
- [x] **apostas** (5 hooks): [useUpcomingMatches](../src/features/apostas/presentation/hooks/useUpcomingMatches.test.ts), [useMatchDetail](../src/features/apostas/presentation/hooks/useMatchDetail.test.ts), [usePredictionHistory](../src/features/apostas/presentation/hooks/usePredictionHistory.test.ts), [useCreatePrediction](../src/features/apostas/presentation/hooks/useCreatePrediction.test.ts), [useSettlePendingPredictions](../src/features/apostas/presentation/hooks/useSettlePendingPredictions.test.ts) (o mais complexo: `useRef` pro callback mais recente, flag `cancelled` no cleanup — testado com desmonte antes do settlement resolver)
- [x] **times** (4 hooks): [usePlayerDetail](../src/features/times/presentation/hooks/usePlayerDetail.test.ts), [useTeamDetail](../src/features/times/presentation/hooks/useTeamDetail.test.ts), [useFavoriteTeams](../src/features/times/presentation/hooks/useFavoriteTeams.test.ts), [useTimesScreen](../src/features/times/presentation/hooks/useTimesScreen.test.ts) (duas listas coordenadas — `allTeams`/`favoriteTeams` — mais `search`/`toggleFavorite` re-sincronizando as duas)
- [x] **grupos**: [useGroups.test.ts](../src/features/grupos/presentation/hooks/useGroups.test.ts)
- [x] **`UserContext`**: [UserContext.test.tsx](../src/shared/presentation/contexts/UserContext.test.tsx) — mapeamento `FirebaseUser → User` (`toUser`: fallback de nome `displayName` → parte local do email → `'Usuário'`), `refreshCoins` (atualiza só `coins`, preserva o resto), unsubscribe do `onAuthStateChanged` ao desmontar, e o `AuthGuard` (redireciona pra `/entrar` fora dos `PUBLIC_SEGMENTS`, não redireciona autenticado). Mocka `expo-router` (`useRouter`/`useSegments`) manualmente — o `jest-expo` preset não mocka isso

**Pegadinha documentada**: `useCreatePrediction` nunca chama `setError(null)` — diferente de `useLogin`/`useRegister`, um erro de tentativa anterior **permanece visível** mesmo depois de uma tentativa bem-sucedida seguinte. O teste documenta esse comportamento atual em vez de presumir a correção (ver [useCreatePrediction.test.ts](../src/features/apostas/presentation/hooks/useCreatePrediction.test.ts)).

**Resultado:** cobertura completa da camada `presentation/hooks` de todas as 5 features + `UserContext`.

## Fase 5 — Presentation: componentes visuais ✅ concluída (parcial — screens de fora)

Maior atrito esperado (mocks de Reanimated, SVG, `expo-image`, `expo-linear-gradient`) — resolvido com 3 peças de infra reaproveitáveis em `test/` (hoje 2, desde a remoção do `svgMock`):

- [x] ~~[test/svgMock.tsx] — mapeado via `moduleNameMapper: { '\\.svg$': ... }` no `jest.config.js`; o `react-native-svg-transformer` não roda sob Jest, então todo `import Flag from '...svg'` vira um `<View testID="svg-flag">`~~
  > **Removido em 08/2026** junto com os SVGs de bandeira (seção 9.10 do [technical-readme.md](technical-readme.md)). Sem nenhum `import ... from '*.svg'` no projeto, o mock, o `moduleNameMapper` e as duas dependências de SVG deixaram de ter função. Mantido aqui como registro: se algum SVG voltar ao projeto, essa peça de infra volta junto.
- [x] [test/setup.tsx](../test/setup.tsx) (`setupFilesAfterEnv`) — mocka `@expo/vector-icons`: a fonte real carrega assíncrono e chama `setState` fora de `act()`, poluindo a saída de todo teste de componente que usa `Ionicons`. O mock troca o ícone por um `<Text testID="icon-{name}">`, o que também permite asserir qual ícone cada estado do componente renderiza
- [x] [test/styleHelpers.ts](../test/styleHelpers.ts) — `flattenStyle`/`collectStyles`/`hasStyle`/`collectProps`: percorrem a árvore de `render(...).toJSON()` para assertar estilo condicional sem precisar espalhar `testID` de teste no código de produção
- [x] `collectCoverageFrom` no `jest.config.js` não exclui mais `presentation/components/**` (antes o coverage da camada ficava invisível mesmo quando testada)

Componentes cobertos, com foco em ramificação/lógica (não snapshot):
- [x] [CardFigurinha](../src/shared/presentation/components/CardFigurinha/index.test.tsx) — gradiente/borda/símbolo por raridade, `selected`, `size` compact/full, formatação de data pt-BR e o fallback `N/A`
- [x] [MolduraIndividualPais](../src/shared/presentation/components/MolduraIndividualPais/index.test.tsx) — mapeamento ISO-3→ISO-2 das 48 seleções, montagem da URL do flagcdn, sub-regiões (`sco`→`gb-sct`), dimensões por `size`
  > Reescrito em 08/2026: os 9 códigos que antes exigiam SVG local (`br`, `ar`, …) passaram a afirmar a URL do CDN, e o `describe('fallback pelo CDN')` virou `describe('mapeamento ISO-3 -> ISO-2')` — não é mais fallback, é o único caminho. Mesma contagem de testes (38).
- [x] [CardPacoteGratis](../src/features/album/presentation/components/CardPacoteGratis.test.tsx) e [CardRecompensaDiaria](../src/features/album/presentation/components/CardRecompensaDiaria.test.tsx) — `formatCountdown` com fake timers, estados disponível/cooldown/`claiming`, o `Alert` com a lista de figurinhas, re-render do intervalo de 30s
- [x] [BotaoHomeMolde](../src/shared/presentation/components/BotaoHomeMolde/index.test.tsx), [PalpiteBtn](../src/shared/presentation/components/PalpiteBtn/index.test.tsx), [MoldeInputs](../src/shared/presentation/components/MoldeInputs/index.test.tsx), [StickerCard](../src/features/album/presentation/components/StickerCard.test.tsx), [CardColecao](../src/shared/presentation/components/CardColecao/index.test.tsx), [CardResumoApostas](../src/features/apostas/presentation/components/CardResumoApostas.test.tsx), [ContainerAposta](../src/features/apostas/presentation/components/ContainerAposta.test.tsx), [CardHistoricoMundial](../src/features/times/presentation/components/CardHistoricoMundial.test.tsx), [CardConquistas](../src/features/times/presentation/components/CardConquistas.test.tsx)

**Pegadinha documentada**: em [CardHistoricoMundial.tsx](../src/features/times/presentation/components/CardHistoricoMundial.tsx), `resultColor` testa `includes('campeão')` antes de `includes('vice')` — `"Vice-campeão"` acaba pintado de **dourado** (cor de campeão), não prata. O teste documenta o comportamento atual (`CardHistoricoMundial.test.tsx`); se a ordem dos `if` for corrigida, o teste precisa mudar junto.

**Fora do escopo desta fase**: as `*Screen.tsx` (composição de hooks + componentes já testados individualmente) e os componentes mais pesados de animação pura (`AnimacaoAbrirPacote`, `ChargeGlow`, `Particle`) — retorno mais baixo por unidade de esforço (mock de `react-native-reanimated` inteiro) frente ao que já está coberto.

**Resultado:** 24 arquivos de teste novos entre hooks e componentes desta fase, mais o `UserContext`.

---

## Fase 6 — Use cases delegantes restantes + correção de erros pré-existentes ✅ concluída

**Use cases de delegação pura** ainda sem teste de contrato (a Fase 2 cobriu 1 por feature como amostra; aqui completamos o resto), em suítes compactas por feature em vez de 1 arquivo por classe:
- [x] `times` (5 use cases): [TeamUseCases.test.ts](../src/features/times/test/domain/usecases/TeamUseCases.test.ts) — `GetAllTeams`, `GetFavoriteTeams`, `GetPlayerById`, `SearchTeams` (incluindo `userId: undefined`), `GetTeamById` (o único que combina 2 chamadas ao repositório — testado propagando erro da primeira sem chamar a segunda)
- [x] `album` (14 use cases): [AlbumUseCases.test.ts](../src/features/album/test/domain/usecases/AlbumUseCases.test.ts) — `AddUserCoins`, `BuyIndividualSticker`, `ClaimDailyCoins`, `ClaimFreePackage`, `GetAlbumById`, `GetAlbumStickers`, `GetAllStickers`, `GetDailyCoinsStatus`, `GetFreePackStatus`, `GetMarketAlbums`, `GetStickersByIds`, `GetUserCoins`, `GetUserCollection`, `GrantStickers`, `OpenPackage`
- [x] `apostas`: [GetPredictionHistory.test.ts](../src/features/apostas/test/domain/usecases/GetPredictionHistory.test.ts), [GetUpcomingMatches.test.ts](../src/features/apostas/test/domain/usecases/GetUpcomingMatches.test.ts)
- Deixados de fora conscientemente: as factories `main/factories/make*.ts` (`new X(repositoryInstance)`) — testá-las exigiria mockar o mesmo Firebase pesado do `firebaseConfig.ts` (que lança se as env vars não existirem) sem cobrir nenhuma lógica nova além do já validado nos testes de `auth` (Fase 2)

**Correção dos erros pré-existentes** (`tsc --noEmit`: 19 → 0; `eslint`: 19 → 0), motivada pela mesma sessão de reforço de testes:
- [x] `firebase/firestore` (7 erros `TS7016`) — bug de empacotamento do `firebase@12.16.0`: `exports["./firestore"].types` aponta para um arquivo `.d.ts` que não existe no pacote publicado. Corrigido com um `paths` no [tsconfig.json](../tsconfig.json) apontando `firebase/firestore` → `@firebase/firestore/dist/index.d.ts` (dependência transitiva já instalada, é exatamente o que o runtime re-exporta)
- [x] Rotas do `expo-router` (11 erros `TS2345`) — `.expo/types/router.d.ts` estava desatualizado (de antes do grupo `app/(auth)/` existir). Regenerado subindo `npx expo start` uma vez. **Atenção**: esse arquivo é gitignored (`.expo/`) — qualquer checkout novo precisa rodar o dev server uma vez antes do `tsc --noEmit` ficar limpo
- [x] [scripts/seedFirestoreUser.ts](../scripts/seedFirestoreUser.ts) (1 erro `TS2307`) — tinha `import serviceAccount from './serviceAccountKey.json'`, arquivo gitignored (nunca existe num checkout limpo). Trocado por leitura em runtime com `readFileSync`, com fallback para `GOOGLE_APPLICATION_CREDENTIALS` e erro amigável se a chave não existir
- [x] Script `typecheck` adicionado ao `package.json` (`tsc --noEmit`) — não existia nenhum comando dedicado antes
- [x] `useSettlePendingPredictions.ts` (`react-hooks/refs`) — escrita de `onSettledRef.current` durante o render (proibido pela regra) movida para um `useEffect` sem array de deps, declarado antes do efeito de settlement (roda primeiro em todo commit, garantindo que a ref esteja atualizada antes do `await` assíncrono)
- [x] `AnimacaoAbrirPacote.tsx` → `ParticleBurst` (`react-hooks/purity`) — o sorteio de `distance`/`delay` de cada partícula (`Math.random()`) foi movido para dentro de um `useMemo` — antes recalculava (e fazia as partículas "pularem" de posição) a cada re-render
- [x] 15 hooks de fetch-on-mount (`useAlbumStickers`, `useAllStickers`, `useDailyCoinsReward`, `useFreePackage`, `useMarketAlbums`, `useStickerDetail`, `useUserProfile`, `useMatchDetail`, `usePredictionHistory`, `useUpcomingMatches`, `useFavoriteTeams`, `usePlayerDetail`, `useTeamDetail`, `useTimesScreen` ×2) + [use-color-scheme.web.ts](../src/hooks/use-color-scheme.web.ts) — `react-hooks/set-state-in-effect` suprimido com `eslint-disable-next-line` documentado. **Decisão consciente, não atalho**: essa regra faz parte do conjunto experimental "React Compiler" do `eslint-plugin-react-hooks` e rejeita o padrão `useEffect(() => { fetchX() }, [deps])` — que é exatamente o recomendado pelos docs oficiais do React para fetch-on-mount — porque tecnicamente o React pode descartar e refazer um render (Strict Mode/Suspense) antes do primeiro `await`. Reescrever os 15 hooks para evitar isso seria uma mudança de arquitetura de data-fetching real (maior risco, fora do escopo de "corrigir os erros"), então a opção escolhida (com o usuário) foi documentar o falso positivo com comentário em vez de refatorar

**Resultado:** `npm run typecheck` limpo, `npx eslint .` com 0 erros (20 warnings pré-existentes, não bloqueantes), 535 testes em 62 suítes (`npm test`).

---

## Fase 7 — Palpites no Firestore + fim dos repositórios Mock ✅ concluída

> Registrada em 08/2026, **depois** das Fases 8 e 9: o número 7 estava vago no plano e foi preenchido por este trabalho. As fases abaixo são cronologicamente anteriores a esta.

O gatilho não foi cobertura, foi um defeito que os testes existentes não podiam pegar: `MockPredictionRepository` era o repositório de palpites **injetado em produção** pelo `repositoryInstance.ts` (fato já anotado na Fase 3.5), guardando tudo num array de instância. Todo palpite — e toda recompensa concedida pelo settlement em cima dele — se perdia no reload. Nenhum teste falhava, porque o repositório fazia exatamente o que seu código dizia; o problema era qual implementação estava plugada.

- [x] [FirestorePredictionRepository.ts](../src/features/apostas/infra/repositories/FirestorePredictionRepository.ts) — coleção raiz `predictions`, um documento por palpite com campo `userId`. O porquê de raiz e não subcoleção está na seção 9.11 do [technical-readme.md](technical-readme.md): `updatePredictionStatus` não recebe `userId`
- [x] [FirestorePredictionRepository.test.ts](../src/features/apostas/test/infra/repositories/FirestorePredictionRepository.test.ts) — 9 testes, mesmo padrão de mock do `FirestoreAlbumRepository` (mocka `firebase/firestore` **e** o módulo `firebaseConfig`, senão o import real valida env vars e tenta inicializar o Firebase de verdade). Cobre: filtro por `userId`, mapeamento doc→entidade **usando o id do documento** (não um campo), ordenação client-side, delegação a `computePredictionStats`, histórico vazio, `addDoc` com `status: 'pending'`, `createdAt` em ISO, e o `updatePredictionStatus` nos dois ramos (documento inexistente → erro sem gravar; existente → grava só `status`)
- [x] Removidos `MockPredictionRepository.ts` e `PredictionSeed.ts`
- [x] Removido o dead code que sobrou da migração para SQLite: `MockGroupRepository`, `MockTeamRepository`, `MockMatchRepository` e os seeds que só eles consumiam (`GroupSeed`, `TeamSeed`, `PlayerSeed`, `MatchSeed`) — nenhum tinha consumidor fora de si mesmo. **Não sobrou nenhum repositório Mock no projeto**
- [x] Palpites de demonstração movidos para [scripts/seedFirestoreUser.ts](../scripts/seedFirestoreUser.ts) — dado de usuário não tem mais seed em código

**Duas coisas que este trabalho ensina sobre o plano de testes:**

1. **Cobertura não vê troca de implementação.** `computePredictionStats` estava 100% coberto desde a Fase 3.5, e os hooks de palpite desde a Fase 4 — ainda assim, o dado não persistia. Teste unitário valida a unidade, não qual unidade foi injetada no `repositoryInstance.ts`. Esse arquivo é o ponto cego estrutural da suíte (ver "Deixados de fora conscientemente" na Fase 6).
2. **O nome do arquivo mentia.** Um `Mock*` em `infra/repositories/` foi lido por muito tempo como double de teste esquecido, quando era produção. Vale como heurística: se um `Mock*` aparece importado por um `repositoryInstance.ts`, ele não é mock — é a implementação.

**Resultado:** 63 suítes, 544 testes, `tsc --noEmit` limpo, `eslint` com 0 erros.

---

## Fase 8 — Devolver as regras de compra ao use case ✅ concluída

A Fase 3.5 extraiu as **funções puras** (sorteio, progresso, cooldown) dos repositórios, mas deixou a **decisão** onde estava: `FirestoreAlbumRepository.buyStickerPack()` continuava conferindo saldo, escolhendo o tamanho do pacote e montando o resultado. Consequência: os use cases `BuyStickerPack` e `BuyIndividualSticker` eram delegação de uma linha, e a única forma de testar a compra era mockando o Firestore inteiro.

Distinção que orientou a mudança: **decidir o que acontece** (checar saldo, sortear, recalcular progresso) é regra de aplicação e pertence ao use case; **montar como aquilo é gravado** (o objeto de update, o `arrayUnion`, o formato do documento) é detalhe de banco e pertence ao repositório. O `import` estava na direção certa nos dois casos — a direção dos imports não pega esse tipo de desvio.

- [x] `PACK_SIZE` e `REFERENCE_ALBUM_ID` extraídos para [collection.ts](../src/features/album/domain/constants/collection.ts) — o `3` estava hardcoded em dois pontos da infra e o `'a1'` em quatro
- [x] Contrato: `buyStickerPack`/`buyIndividualSticker` saíram do `AlbumRepository`, substituídos por `commitStickerPurchase(commit: StickerPurchaseCommit)` — uma única escrita, com saldo/ids/progresso já decididos. O tipo tem forma de domínio, não de Firestore
- [x] [BuyStickerPack.ts](../src/features/album/domain/usecases/BuyStickerPack.ts) e [BuyIndividualSticker.ts](../src/features/album/domain/usecases/BuyIndividualSticker.ts) passaram a conter as regras, com `random` e `now` injetáveis no construtor (mesmo padrão da Fase 3.5, agora aplicado a classes em vez de funções)
- [x] [FirestoreAlbumRepository.ts](../src/features/album/infra/repositories/FirestoreAlbumRepository.ts) perdeu 57 linhas: as duas compras viraram um método de persistência de 8 linhas que não decide nada
- [x] Testes: [BuyStickerPack.test.ts](../src/features/album/test/domain/usecases/BuyStickerPack.test.ts) (9 testes) e [BuyIndividualSticker.test.ts](../src/features/album/test/domain/usecases/BuyIndividualSticker.test.ts) (8) deixaram de ser contrato e passaram a cobrir comportamento — saldo exato, repetição no sorteio, figurinha já possuída, álbum de referência. 100% nas quatro métricas, **sem mockar Firestore**
- [x] O `describe('buyStickerPack')` do teste de infra virou `describe('commitStickerPurchase')`, verificando escrita única e ausência de decisão

**Nenhuma mudança em Presentation.** As assinaturas de `execute()` continuaram idênticas, então hooks, factories e telas não foram tocados — evidência prática de que o contrato do use case estava bem colocado desde o início.

**Resultado:** 62 suítes, 535 testes, `tsc --noEmit` limpo, `eslint` com 0 erros.

### Ainda em aberto — regras que seguem no `FirestoreAlbumRepository`

A Fase 8 corrigiu **2 das 8** operações do repositório. As demais continuam com decisão dentro da Infra, pelo mesmo motivo que as compras tinham — e é por isso que os use cases `ClaimDailyCoins`, `ClaimFreePackage`, `GrantStickers` e `OpenPackage` ainda são delegação de uma linha:

| Onde | Decisão que ficou | Linha |
|---|---|---|
| `ensureUserDoc` / `getUserCoins` | saldo inicial de 200 moedas — regra de negócio, duplicada em dois pontos | [:55](../src/features/album/infra/repositories/FirestoreAlbumRepository.ts#L55), [:100](../src/features/album/infra/repositories/FirestoreAlbumRepository.ts#L100) |
| `deductUserCoins` | "o saldo nunca fica negativo" (`Math.max(0, …)`) | [:105](../src/features/album/infra/repositories/FirestoreAlbumRepository.ts#L105) |
| `claimDailyCoins` | recusa se o cooldown não venceu | [:131](../src/features/album/infra/repositories/FirestoreAlbumRepository.ts#L131) |
| `claimFreePackage` / `openPackage` | recusa + sorteio do pacote grátis | [:232](../src/features/album/infra/repositories/FirestoreAlbumRepository.ts#L232) |
| `grantStickers` | filtra as já possuídas e recalcula progresso | [:244](../src/features/album/infra/repositories/FirestoreAlbumRepository.ts#L244) |
| `getMarketAlbums` | cruza coleção × catálogo para contar por álbum | [:151](../src/features/album/infra/repositories/FirestoreAlbumRepository.ts#L151) |

Nem tudo dessa lista deve subir: `ensureUserDoc` criar o documento se não existir é ciclo de vida do Firestore, legitimamente Infra — o que não pertence ali é o número **200**, que é regra e deveria morar em `domain/constants/` junto de `PACK_SIZE`. Já `claimFreePackage` e `grantStickers` são casos idênticos aos das compras e subiriam inteiros.

**Caminho quando for retomar:** generalizar `commitStickerPurchase` para um `commitCollectionChange` (saldo opcional + ids + progresso + timestamp de resgate) e mover as decisões para os quatro use cases, replicando o que a Fase 8 fez. Os testes de Infra correspondentes viram testes de escrita, como aconteceu com `commitStickerPurchase`.

**Outra pendência, independente desta:** `pendingPackStore` continua sendo importado direto pela Presentation em [useAbrirPacote.ts:5](../src/features/album/presentation/hooks/useAbrirPacote.ts#L5) e [useBuyStickerPack.ts:5](../src/features/album/presentation/hooks/useBuyStickerPack.ts#L5) — única violação da direção dos imports no projeto.

---

## Fase 9 — Reorganização dos testes de Domain e Infra em `test/` por feature ✅ concluída

Até aqui todo teste ficava ao lado do arquivo testado (convenção da Fase 1). Com a suíte madura, os diretórios `domain/usecases/` e `infra/repositories/` passaram a ter mais arquivos de teste do que de produção, e ler a lista de use cases de uma feature exigia filtrar `.test.ts` mentalmente. Os testes de Domain e Infra passaram para uma pasta `test/` **dentro de cada feature**, espelhando a estrutura de camadas:

```
src/features/<feature>/
├── domain/usecases/BuyStickerPack.ts        ← produção
├── infra/repositories/SQLiteAlbumCatalogRepository.ts
└── test/
    ├── domain/usecases/BuyStickerPack.test.ts       ← teste
    └── infra/repositories/SQLiteAlbumCatalogRepository.test.ts
```

**O que mudou de lugar** — 17 arquivos, nas 5 features:

| Feature | `test/domain/usecases/` | `test/infra/repositories/` |
|---|---|---|
| album | `AlbumUseCases`, `BuyIndividualSticker`, `BuyStickerPack`, `GetUserProfile` | `FirestoreAlbumRepository`, `SQLiteAlbumCatalogRepository` |
| apostas | `CreatePrediction`, `GetPredictionHistory`, `GetUpcomingMatches`, `SettlePendingPredictions` | `SQLiteMatchRepository` |
| times | `TeamUseCases`, `ToggleFavoriteTeam` | `SQLiteTeamRepository` |
| grupos | `GetAllGroups` | `SQLiteGroupRepository` |
| auth | — *(feature sem `domain/usecases`)* | `FirebaseAuthRepository` |

**O que continua co-localizado**, deliberadamente: `presentation/hooks/`, `presentation/components/`, `domain/constants/`, `infra/stores/` e `main/factories/` (`auth/main/factories/makeAuth.test.ts`). O critério foi mover só as duas camadas onde a proporção teste/produção mais atrapalhava a leitura do diretório; um segundo passo pode estender o padrão ao resto, mas isso ainda não foi feito.

**Nenhuma mudança em `jest.config.js`.** O `testMatch` padrão do Jest casa por sufixo `.test.ts`, não por diretório — a nova árvore é reconhecida sem config extra, do mesmo jeito que a antiga. `collectCoverageFrom` também não precisou mudar: ele lista os arquivos *de produção*, e `src/**/*.{ts,tsx}` nunca incluiu testes.

**A parte que dá trabalho são os imports relativos.** Cada arquivo desceu de `<feature>/domain/usecases/` para `<feature>/test/domain/usecases/` — um nível a mais de profundidade — então todo especificador relativo mudou:

```ts
// antes, em domain/usecases/BuyStickerPack.test.ts
import { BuyStickerPack } from './BuyStickerPack';
import { PACK_SIZE } from '../constants/collection';
import { makeSticker } from '../../../../../test/fixtures';

// depois, em test/domain/usecases/BuyStickerPack.test.ts
import { BuyStickerPack } from '../../../domain/usecases/BuyStickerPack';
import { PACK_SIZE } from '../../../domain/constants/collection';
import { makeSticker } from '../../../../../../test/fixtures';
```

Dois detalhes que custam tempo se a migração for feita à mão:

1. **As strings de `jest.mock()` também são caminhos** e não são verificadas pelo TypeScript — um `jest.mock('../../../../shared/infra/sqlite/database')` desatualizado passa no `tsc --noEmit` e só falha em runtime, com `Cannot find module`. Os testes de Infra têm de 1 a 3 `jest.mock` cada.
2. **O caminho para `test/fixtures.ts` (na raiz, fora de `src/`) fica com 6 níveis** de `../`, e é o mais fácil de errar por um nível.

A migração foi feita com um script que recalcula cada especificador por aritmética de path (`path.relative` da pasta nova até o alvo resolvido a partir da pasta antiga), cobrindo `import` e `jest.mock` na mesma passada, com um *dry-run* que confirma que todo alvo resolve para um arquivo existente antes de escrever. Fazer isso à mão em 17 arquivos é onde os erros aparecem.

**Verificação:** `npm test` (62 suítes, 535 testes) e `npm run typecheck` limpos, antes e depois — a reorganização não alterou nenhum teste nem nenhum arquivo de produção, só a localização e os imports. Os 35 links deste documento que apontavam para os caminhos antigos foram atualizados junto.

---

## Inventário completo de testes unitários

Todos os `it(...)` já escritos, agrupados por arquivo — atualizado a cada fase. Números por fase abaixo; total atual: **544 testes em 63 suítes** (rode `npm test` para o número exato e sempre atualizado — este documento descreve o quê foi coberto, não recalcula a contagem a cada edição).

### Domain — regras de negócio puras

**[rewards.test.ts](../src/features/album/domain/constants/rewards.test.ts)**
- `computeDailyClaimStatus`
  - libera quando nunca foi resgatado
  - bloqueia antes do fim do cooldown
  - libera exatamente no limite do cooldown
  - libera depois do fim do cooldown
- `computeDailyCoinsStatus`
  - usa o cooldown de moedas diárias e retorna o valor fixo de recompensa
  - bloqueia dentro do cooldown de moedas diárias
- `computeFreePackStatus`
  - usa o mesmo cooldown de 24h do pacote grátis
  - libera o pacote grátis depois do cooldown

**[SettlePendingPredictions.test.ts](../src/features/apostas/test/domain/usecases/SettlePendingPredictions.test.ts)**
- ignora predições que não estão pendentes
- ignora predições cuja partida ainda não terminou
- ignora predições cuja partida não existe mais
- marca como vencedora quando o placar previsto bate e concede moedas
- marca como perdedora quando o placar previsto não bate e não concede recompensa
- concede stickers quando a recompensa vencedora é do tipo sticker

**[GetUserProfile.test.ts](../src/features/album/test/domain/usecases/GetUserProfile.test.ts)**
- usa a data de obtenção por usuário quando disponível, com fallback pro catálogo
- ordena recentStickers por data de obtenção, mais recente primeiro (stickers preserva a ordem do catálogo)
- filtra apenas raras e lendárias em rareStickers
- corta recentStickers nos 10 mais recentes

### Domain — regra de negócio extraída da infra (Fase 3.5)

**[ranking.test.ts](../src/features/times/domain/constants/ranking.test.ts)**
- retorna 0.5 quando não há ranking (0 ou negativo)
- calcula 1 - ranking/100 para rankings dentro da faixa normal
- nunca fica abaixo do piso de 0.3, mesmo com ranking muito alto
- respeita o limite exato do piso em ranking = 70

**[playerStats.test.ts](../src/features/times/domain/constants/playerStats.test.ts)**
- atacante (ATA): calcula goals/assists dentro da faixa de atacante
- meia (MEI): calcula goals/assists dentro da faixa de meio-campo
- defensor (DEF): só marca gol quando random > 0.8
- posição desconhecida: goals e assists ficam zerados, mas matchesPlayed/worldCupsPlayed continuam sendo gerados
- matchesPlayed fica entre 3 e 6, worldCupsPlayed entre 1 e 2

**[odds.test.ts](../src/features/apostas/domain/constants/odds.test.ts)**
- é determinístico: o mesmo id sempre gera as mesmas odds
- calcula as odds a partir do hash de soma dos char codes do id
- ids diferentes tendem a gerar odds diferentes

**[collection.test.ts](../src/features/album/domain/constants/collection.test.ts)**
- `computeCollectionProgress`
  - calcula o percentual de figurinhas possuídas em relação ao total
- `drawUnownedStickers`
  - nunca sorteia uma figurinha já possuída
  - sorteia no máximo `count` figurinhas
  - sorteia menos que `count` quando não há figurinhas suficientes disponíveis
  - não repete figurinhas no resultado
- `drawStickersWithRepetition`
  - escolhe o índice via floor(random() * pool.length), podendo repetir
  - repete a mesma figurinha quando o random injetado retorna sempre o mesmo valor

**[predictionStats.test.ts](../src/features/apostas/domain/constants/predictionStats.test.ts)**
- retorna 0/0 quando não há predições
- retorna 0/0 quando só há predições pendentes (nenhuma resolvida)
- calcula successRate só sobre predições resolvidas, ignorando pendentes
- soma coinAmount só das predições vencedoras em totalPoints
- arredonda o successRate

### Domain — testes de contrato (delegação pura)

| Feature | Arquivo | Teste |
|---|---|---|
| apostas | [CreatePrediction.test.ts](../src/features/apostas/test/domain/usecases/CreatePrediction.test.ts) | delega a criação da predição para o repositório com os dados recebidos e retorna o resultado |
| times | [ToggleFavoriteTeam.test.ts](../src/features/times/test/domain/usecases/ToggleFavoriteTeam.test.ts) | delega o toggle de favorito para o repositório com os argumentos recebidos |
| grupos | [GetAllGroups.test.ts](../src/features/grupos/test/domain/usecases/GetAllGroups.test.ts) | delega a busca de todos os grupos para o repositório e retorna o resultado |
| auth | [makeAuth.test.ts](../src/features/auth/main/factories/makeAuth.test.ts) | delega o login para authRepositoryInstance com e-mail e senha |

> `BuyStickerPack` saiu desta tabela na Fase 8: deixou de delegar e virou teste de comportamento.

### Domain — regras de compra (Fase 8)

**[BuyStickerPack.test.ts](../src/features/album/test/domain/usecases/BuyStickerPack.test.ts)** — 9 testes, sorteio e relógio injetados
- recusa a compra quando o saldo não cobre o custo, sem persistir nada
- aceita a compra quando o saldo é exatamente igual ao custo
- sorteia `PACK_SIZE` figurinhas e carimba `obtainedAt` em todas
- debita o custo e envia ao repositório o resultado já decidido
- não conta figurinha repetida duas vezes no progresso
- não recontabiliza figurinha que o usuário já possuía
- calcula o progresso contra o álbum de referência, não contra o álbum comprado
- devolve um `packId` derivado do relógio injetado
- sem injeção, usa `Math.random` e o relógio do sistema *(fecha o ramo dos parâmetros default)*

**[BuyIndividualSticker.test.ts](../src/features/album/test/domain/usecases/BuyIndividualSticker.test.ts)** — 8 testes
- recusa quando a figurinha não existe no catálogo, **antes** de olhar o saldo
- recusa quando o saldo não cobre o custo, sem persistir nada
- aceita quando o saldo é exatamente igual ao custo
- debita o custo e envia ao repositório o resultado já decidido
- devolve a figurinha carimbada com a data da compra
- não altera o progresso ao recomprar uma figurinha já possuída
- calcula o progresso contra o álbum de referência
- sem injeção, usa o relógio do sistema

### Infra — repositórios (SQLite / Firebase mockados)

**[SQLiteAlbumCatalogRepository.test.ts](../src/features/album/test/infra/repositories/SQLiteAlbumCatalogRepository.test.ts)**
- `getAlbumById`
  - mapeia a linha do banco para a entidade Album
  - lança erro quando o álbum não existe
- `getMarketAlbums`
  - mapeia todas as linhas com ownedStickersCount sempre zerado
- `getStickersByIds`
  - retorna [] sem consultar o banco quando a lista de ids está vazia
  - converte player_id/team_id nulos para undefined e faz cast de rarity
  - monta os placeholders IN (?, ?, ...) de acordo com a quantidade de ids
- `getStickersByAlbumId`
  - consulta por album_id e mapeia as linhas
- `getAllStickers`
  - consulta todas as figurinhas ordenadas por id

**[FirebaseAuthRepository.test.ts](../src/features/auth/test/infra/repositories/FirebaseAuthRepository.test.ts)**
- `signInAnonymously`
  - faz login anônimo, garante o documento do usuário e mapeia o retorno
- `signInWithEmail`
  - autentica com e-mail/senha e preserva nome e e-mail no documento do usuário
- `register`
  - cria o usuário, atualiza o displayName e cria o documento com o nome informado
- signOut delega para o signOut do Firebase Auth
- `getCurrentUser`
  - retorna null quando não há usuário autenticado
  - retorna o usuário mapeado quando há sessão ativa
- resetPassword delega para sendPasswordResetEmail com o e-mail recebido
- `onAuthStateChanged`
  - repassa a inscrição para o Firebase Auth e mapeia o usuário no callback
  - chama o callback com null quando o usuário desloga

**[SQLiteTeamRepository.test.ts](../src/features/times/test/infra/repositories/SQLiteTeamRepository.test.ts)**
- `getAllTeams`
  - mapeia countryId a partir da flag_url, parseia titles e calcula winRate/isUnbeaten
  - countryId fica vazio quando não há flag_url
- `getFavoriteTeams`
  - retorna [] sem consultar o SQLite quando o usuário não tem favoritos
  - busca os times favoritos e marca isFavorite: true
  - não deixa o erro do Firestore propagar — trata como sem favoritos
- `searchTeams`
  - busca por LIKE e marca isFavorite conforme os favoritos do usuário
  - sem userId, não consulta favoritos e isFavorite fica sempre false
- `toggleFavorite`
  - remove dos favoritos quando o time já é favorito
  - adiciona aos favoritos quando o time ainda não é favorito
- `getById`
  - lança erro quando o time não existe
  - mapeia o time encontrado
- `getPlayersByTeam / getPlayerById`
  - getPlayersByTeam mapeia todos os jogadores do time
  - getPlayerById lança erro quando o jogador não existe
  - number cai para 10 quando não há número no row

**[SQLiteMatchRepository.test.ts](../src/features/apostas/test/infra/repositories/SQLiteMatchRepository.test.ts)**
- `getUpcomingMatches`
  - consulta só partidas agendadas, ordenadas por data
- `getMatchById`
  - retorna null quando a partida não existe
  - partida agendada: gera odds e não expõe placar
  - partida finalizada: expõe o placar e não gera odds
  - partida ao vivo: sem odds e sem placar
  - usa "Fase de Grupos" como fallback quando não há group_label

**[FirestorePredictionRepository.test.ts](../src/features/apostas/test/infra/repositories/FirestorePredictionRepository.test.ts)** *(Fase 7)*
- `getPredictionHistory`
  - filtra os palpites pelo userId recebido
  - mapeia cada documento para a entidade Prediction, usando o id do doc
  - ordena do mais recente para o mais antigo no cliente
  - calcula successRate e totalPoints só sobre os palpites resolvidos
  - devolve histórico vazio e zerado quando o usuário nunca palpitou
- `createPrediction`
  - grava o palpite como pending e devolve o id gerado pelo Firestore
  - carimba createdAt em ISO no momento da criação
- `updatePredictionStatus`
  - lança erro quando o palpite não existe, sem gravar nada
  - grava só o campo status e devolve o palpite já atualizado

**[SQLiteGroupRepository.test.ts](../src/features/grupos/test/infra/repositories/SQLiteGroupRepository.test.ts)**
- `getAllGroups`
  - busca os grupos e, para cada um, os standings ordenados por critério de desempate
  - deriva teamIds a partir dos standings de cada grupo
- `getGroupById`
  - lança erro quando o grupo não existe
  - mapeia o grupo e seus standings quando encontrado

**[FirestoreAlbumRepository.test.ts](../src/features/album/test/infra/repositories/FirestoreAlbumRepository.test.ts)**
- `getUserCollection / ensureUserDoc`
  - não recria o documento quando o usuário já existe
  - cria o documento com valores padrão quando o usuário ainda não existe
- `getUserCoins`: retorna 200 (padrão) quando o campo coins ainda não existe
- `deductUserCoins`: nunca deixa o saldo ficar negativo
- `claimDailyCoins`
  - lança erro quando a recompensa diária ainda não está disponível
  - credita as moedas e grava o timestamp quando disponível
- `claimFreePackage`
  - lança erro quando o pacote grátis ainda não está disponível
  - sorteia só entre as figurinhas não possuídas quando disponível
- `openPackage`: delega para o mesmo sorteio sem repetição do pacote grátis
- `getMarketAlbums`: cruza a coleção do usuário com o catálogo para calcular ownedStickersCount por álbum
- `commitStickerPurchase` *(substituiu `buyStickerPack`/`buyIndividualSticker` na Fase 8)*
  - grava saldo, ids e progresso em uma única escrita
  - não decide nada: grava o saldo recebido mesmo que seja maior que o anterior
  - cria o documento do usuário antes de gravar, se ele ainda não existir
- `grantStickers`
  - não grava nada quando todas as figurinhas já são possuídas
  - concede só as figurinhas que o usuário ainda não tem

---

### Presentation — hooks, contexto e componentes (Fases 4 e 5)

Dado o volume (mais de 300 `it(...)` novos), esta seção resume por arquivo em vez de enumerar cada asserção — o padrão de nomeação dos testes (em português, descrevendo o comportamento) já serve como changelog navegável dentro de cada arquivo linkado.

| Camada | Arquivos | O que é coberto |
|---|---|---|
| Hooks — `auth` | [useLogin](../src/features/auth/presentation/hooks/useLogin.test.ts), [useRegister](../src/features/auth/presentation/hooks/useRegister.test.ts), [useForgotPassword](../src/features/auth/presentation/hooks/useForgotPassword.test.ts) | Tradução de cada código de erro do Firebase, estados `loading`/`error`/`sent` |
| Hooks — `album` | 10 hooks (ver Fase 4) + [pendingPackStore](../src/features/album/infra/stores/pendingPackStore.test.ts) | Fetch-on-mount, ações de compra/resgate, `pendingPackStore`, agrupamento por raridade |
| Hooks — `apostas` | 5 hooks (ver Fase 4) | Fetch-on-mount, criação de palpite, settlement com `useRef`+cleanup |
| Hooks — `times` | 4 hooks (ver Fase 4) | Fetch-on-mount, duas listas coordenadas (`useTimesScreen`), toggle de favorito |
| Hooks — `grupos` | [useGroups](../src/features/grupos/presentation/hooks/useGroups.test.ts) | Fetch-on-mount simples |
| Contexto | [UserContext](../src/shared/presentation/contexts/UserContext.test.tsx) | `toUser`, `refreshCoins`, unsubscribe, `AuthGuard` |
| Componentes | 13 componentes (ver Fase 5) | Estilo condicional por estado/prop, formatação, interação (`fireEvent.press`) |
| Use cases delegantes | [TeamUseCases](../src/features/times/test/domain/usecases/TeamUseCases.test.ts), [AlbumUseCases](../src/features/album/test/domain/usecases/AlbumUseCases.test.ts), [GetPredictionHistory](../src/features/apostas/test/domain/usecases/GetPredictionHistory.test.ts), [GetUpcomingMatches](../src/features/apostas/test/domain/usecases/GetUpcomingMatches.test.ts) | Argumentos corretos repassados ao repositório, retorno propagado sem transformação |

**Infra de teste reutilizável** (pasta `test/`, fora de `src/`): [fixtures.ts](../test/fixtures.ts) (`makeUser`, `makeSticker`, `makeTeam`, `makePlayer`, `makeMatch`), [styleHelpers.ts](../test/styleHelpers.ts), [setup.tsx](../test/setup.tsx). *(`svgMock.tsx` existiu até 08/2026 — ver Fase 5.)*

---

## Verificação

- `npm test` deve rodar e passar após cada fase — atualmente 544 testes em 63 suítes
- `npm run test:coverage` para acompanhar cobertura por camada (`presentation/components` e `presentation/hooks` não são mais excluídos do `collectCoverageFrom`)
- `npm run typecheck` (`tsc --noEmit`) deve ficar limpo — **atenção**: depende de `.expo/types/router.d.ts`, que é gerado por `npx expo start` e é gitignored; rode o dev server uma vez após um checkout novo antes de confiar no typecheck
- `npm run lint` (`expo lint`) deve ficar em 0 erros — os warnings restantes (`react-hooks/exhaustive-deps`, `no-unused-vars`) são pré-existentes e não bloqueantes
