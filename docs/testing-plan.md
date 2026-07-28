# Plano de Testes Unitários — Jest

Documento de referência e estudo para a implantação de testes unitários no projeto. Descreve a estratégia, a configuração e o plano faseado de implementação. Cada fase é marcada como concluída conforme avança.

---

## Por que começar pelo Domain

O projeto segue Clean Architecture ([technical-readme.md](technical-readme.md)), então a lógica de negócio fica isolada em `domain/`, sem nenhuma dependência de React Native, Expo ou banco de dados. Isso torna essa camada a mais barata de testar (nenhum mock de módulo nativo) e a mais valiosa (é onde as regras do app vivem).

Mapeando os use cases existentes, um padrão ficou claro: a maioria é **delegação pura de uma linha** para o repositório — por exemplo:

```ts
// BuyStickerPack.ts
export class BuyStickerPack {
  constructor(private readonly albumRepository: AlbumRepository) {}
  async execute(userId: string, albumId: string, cost: number) {
    return this.albumRepository.buyStickerPack(userId, albumId, cost);
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

---

## Fase 2 — Domain: regras de negócio puras ✅ concluída

- [x] `rewards.ts`: nunca resgatado, exatamente no limite do cooldown, antes do cooldown, depois do cooldown — para os dois cooldowns (moedas diárias e pacote grátis) → [rewards.test.ts](../src/features/album/domain/constants/rewards.test.ts)
- [x] `SettlePendingPredictions`: ignora predição não-pendente; ignora partida não finalizada/sem placar; acerta vitória (placar bate) e derrota (não bate); concede `coins` vs `stickers` conforme o tipo de recompensa; atualiza o status → [SettlePendingPredictions.test.ts](../src/features/apostas/domain/usecases/SettlePendingPredictions.test.ts)
- [x] `GetUserProfile`: usa `stickerObtainedAt` do usuário quando existe (fallback pro catálogo); ordena `recentStickers` por data desc; filtra `rara`/`lendaria`; corta em 10 recentes → [GetUserProfile.test.ts](../src/features/album/domain/usecases/GetUserProfile.test.ts)
  > Pegadinha encontrada durante os testes: o campo `stickers` retornado **não** é ordenado — só `recentStickers`/`rareStickers` usam a lista ordenada internamente. Um teste ingênuo que assume `stickers` ordenado falha; vale como exemplo de como o teste também documenta o comportamento real do código.
- [x] 5 testes de contrato (um por feature) para o padrão de delegação pura:
  - `album` → [BuyStickerPack.test.ts](../src/features/album/domain/usecases/BuyStickerPack.test.ts)
  - `apostas` → [CreatePrediction.test.ts](../src/features/apostas/domain/usecases/CreatePrediction.test.ts)
  - `times` → [ToggleFavoriteTeam.test.ts](../src/features/times/domain/usecases/ToggleFavoriteTeam.test.ts)
  - `grupos` → [GetAllGroups.test.ts](../src/features/grupos/domain/usecases/GetAllGroups.test.ts)
  - `auth` → [makeAuth.test.ts](../src/features/auth/main/factories/makeAuth.test.ts) — feature sem `domain/usecases` (as factories chamam o repositório direto), então o teste mocka o módulo `repositoryInstance` em vez de injetar um mock por construtor. Padrão diferente, mesmo objetivo.

**Mocks:** como os repositórios são interfaces TypeScript, os testes usam objetos simples com `jest.fn()` por método — nenhum setup de React Native é necessário nesta fase.

**Resultado:** 8 suítes, 23 testes, todos passando (`npm test`).

---

## Fase 3 — Infra: repositórios (SQLite / Firestore mockados) ✅ concluída

Sem banco real em ambiente Node — a estratégia é mockar o ponto de acesso ao driver (não o repositório inteiro), validando mapeamento linha→entidade e montagem de queries:

- [x] `jest.mock` em [database.ts](../src/shared/infra/sqlite/database.ts) (`getSQLiteDb`), retornando um fake com `getFirstAsync`/`getAllAsync` como `jest.fn()`
- [x] Exemplo completo: [SQLiteAlbumCatalogRepository.ts](../src/features/album/infra/repositories/SQLiteAlbumCatalogRepository.ts) → [SQLiteAlbumCatalogRepository.test.ts](../src/features/album/infra/repositories/SQLiteAlbumCatalogRepository.test.ts) — `getAlbumById` (mapeia e lança erro quando não encontra), `getMarketAlbums`, `getStickersByIds` (early-return em array vazio, conversão `null`→`undefined`, cast de `rarity`, placeholders `IN (?,?,...)`), `getStickersByAlbumId`, `getAllStickers`
- [x] Repositório Firebase Auth: [FirebaseAuthRepository.ts](../src/features/auth/infra/repositories/FirebaseAuthRepository.ts) → [FirebaseAuthRepository.test.ts](../src/features/auth/infra/repositories/FirebaseAuthRepository.test.ts) — mocka `firebase/auth`, `firebase/firestore` **e** o módulo `firebaseConfig` (senão o import real dispara a validação de variáveis de ambiente e tenta inicializar o Firebase de verdade)
- [x] [SQLiteTeamRepository.ts](../src/features/times/infra/repositories/SQLiteTeamRepository.ts) → [SQLiteTeamRepository.test.ts](../src/features/times/infra/repositories/SQLiteTeamRepository.test.ts) — mocka SQLite **e** Firestore (favoritos ficam no Firestore, elenco no SQLite) + `../../domain/constants/playerStats` (pra não depender de `Math.random` real neste nível). Inclui o caso do `try/catch` que engole erro do Firestore e devolve `[]` em vez de propagar
- [x] [SQLiteMatchRepository.ts](../src/features/apostas/infra/repositories/SQLiteMatchRepository.ts) → [SQLiteMatchRepository.test.ts](../src/features/apostas/infra/repositories/SQLiteMatchRepository.test.ts) — odds só aparecem em partidas `scheduled`; placar só aparece em `finished`
- [x] [SQLiteGroupRepository.ts](../src/features/grupos/infra/repositories/SQLiteGroupRepository.ts) → [SQLiteGroupRepository.test.ts](../src/features/grupos/infra/repositories/SQLiteGroupRepository.test.ts) — `getAllGroups` faz N+1 queries (uma por grupo pros standings); mock usa `mockResolvedValueOnce` encadeado pra simular cada chamada em sequência
- [x] [FirestoreAlbumRepository.ts](../src/features/album/infra/repositories/FirestoreAlbumRepository.ts) → [FirestoreAlbumRepository.test.ts](../src/features/album/infra/repositories/FirestoreAlbumRepository.test.ts) — o mais complexo: `catalogRepository` (dependência concreta, não interface) é substituído por um objeto `jest.fn()` via `as unknown as jest.Mocked<SQLiteAlbumCatalogRepository>` (contorna o `private` da classe real, que quebraria a checagem estrutural do TS). Cobre as guardas de erro (saldo insuficiente, recompensa/pacote ainda não disponível, figurinha inexistente), `ensureUserDoc` (cria vs. reaproveita o doc) e o cruzamento de dados Firestore+SQLite em `getMarketAlbums`. Como o mock do Firestore não simula estado real, os testes verificam a *chamada* a `updateDoc` (o quê foi gravado), não uma releitura pós-gravação

Repositórios Mock em memória (`MockTeamRepository`, `MockGroupRepository`, `MockPredictionRepository`) já são fakes — baixa prioridade, deixados de fora.

**Resultado:** 19 suítes, 105 testes, todos passando (`npm test`), `tsc --noEmit` limpo.

---

## Fase 3.5 — Extrair regra de negócio dos repositórios de infra ✅ concluída

Ao tentar testar o `FirestoreAlbumRepository` na Fase 3, ficou claro que ele mistura regra de negócio (sorteio, cálculo de progresso) com chamadas Firestore no mesmo método — intestável sem mockar `Math.random` numa cadeia grande de `getDoc`/`updateDoc`. Levantando os outros repositórios de infra, o mesmo defeito apareceu em mais lugares, em graus variados. Extraímos tudo para funções puras em `domain/constants/` (mesmo padrão do `rewards.ts`: parâmetros injetáveis como `random: () => number = Math.random` no lugar do não-determinismo direto), testamos essas funções isoladamente, e os repositórios passaram só a chamá-las. **Refatoração pura — nenhum comportamento observável do app mudou.**

- [x] `computeWinRate` — [ranking.ts](../src/features/times/domain/constants/ranking.ts) — substituiu 4 cópias idênticas da fórmula em [SQLiteTeamRepository.ts](../src/features/times/infra/repositories/SQLiteTeamRepository.ts)
- [x] `generatePlayerStats` — [playerStats.ts](../src/features/times/domain/constants/playerStats.ts) — o pior caso encontrado: gerava gols/assistências/jogos com `Math.random()` direto dentro de um mapper de linha→entidade. Agora recebe `random` injetável e é 100% testável
- [x] `computeMatchOdds` — [odds.ts](../src/features/apostas/domain/constants/odds.ts) — já era determinístico (hash do id da partida), só não estava extraído; testado com valores exatos conhecidos
- [x] `computeCollectionProgress`, `drawUnownedStickers`, `drawStickersWithRepetition` — [collection.ts](../src/features/album/domain/constants/collection.ts) — o cálculo de progresso estava duplicado **5 vezes** dentro do `FirestoreAlbumRepository`; os dois algoritmos de sorteio (sem repetição / com repetição, usados em fluxos diferentes) também saíram de lá
- [x] `computePredictionStats` — [predictionStats.ts](../src/features/apostas/domain/constants/predictionStats.ts) — extraído do `MockPredictionRepository`. Importante: esse Mock é o repositório real em produção hoje (`repositoryInstance.ts` da feature `apostas` usa `MockPredictionRepository`, não SQLite), não só um double de teste

**Bug de tooling encontrado no caminho:** `tsc --noEmit` nunca tinha sido rodado no projeto (só `expo lint`, que é ESLint, roda no CI/scripts). Descobrimos que `describe`/`it`/`expect`/`jest` estavam **todos** com erro de tipo em todo arquivo de teste desde a Fase 1 — mascarado porque `npm test` usa Babel (não type-checa). Duas causas, duas correções:
1. Sem `"types": ["jest"]` no [tsconfig.json](../tsconfig.json), o TypeScript não carregava `@types/jest` (mesmo estando instalado) — corrigido adicionando essa linha.
2. `@types/jest` declara `jest` como **namespace de tipos** (`jest.Mock`), não como valor global — `jest.fn()`/`jest.mock()` davam erro "Cannot use namespace as a value". Corrigido instalando `@jest/globals` (que já era dependência transitiva) e mesclando o tipo no global scope via [declarations.d.ts](../src/declarations.d.ts).

Depois das duas correções: `npx tsc --noEmit` limpo, zero erros no projeto inteiro.

**Resultado:** 15 suítes, 64 testes, todos passando (`npm test`), mais `tsc --noEmit` limpo.

---

## Fase 4 — Presentation: hooks (opcional, conforme tempo)

- [ ] Setup: `renderHook`/`act` do `@testing-library/react-native`, mock do módulo de factory (`jest.mock('../../main/factories/makeBuyStickerPack')`) e mock do `UserContext`
- [ ] Alvos representativos: [useBuyStickerPack.ts](../src/features/album/presentation/hooks/useBuyStickerPack.ts) (estados `loading`/`error`, chamada a `pendingPackStore` e `refreshCoins`), `useDailyCoinsReward`, `useUpcomingMatches`

## Fase 5 — Presentation: componentes/telas (fora do escopo inicial)

Maior atrito (mocks de Reanimated, SVG, `expo-image`, `expo-linear-gradient`) para menor retorno acadêmico. Só entra se sobrar tempo depois das fases 1–4.

---

## Inventário completo de testes unitários

Todos os `it(...)` já escritos, agrupados por arquivo — atualizado a cada fase. 105 testes em 19 suítes até o momento.

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

**[SettlePendingPredictions.test.ts](../src/features/apostas/domain/usecases/SettlePendingPredictions.test.ts)**
- ignora predições que não estão pendentes
- ignora predições cuja partida ainda não terminou
- ignora predições cuja partida não existe mais
- marca como vencedora quando o placar previsto bate e concede moedas
- marca como perdedora quando o placar previsto não bate e não concede recompensa
- concede stickers quando a recompensa vencedora é do tipo sticker

**[GetUserProfile.test.ts](../src/features/album/domain/usecases/GetUserProfile.test.ts)**
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
| album | [BuyStickerPack.test.ts](../src/features/album/domain/usecases/BuyStickerPack.test.ts) | delega a compra para o repositório com os argumentos recebidos e retorna o resultado |
| apostas | [CreatePrediction.test.ts](../src/features/apostas/domain/usecases/CreatePrediction.test.ts) | delega a criação da predição para o repositório com os dados recebidos e retorna o resultado |
| times | [ToggleFavoriteTeam.test.ts](../src/features/times/domain/usecases/ToggleFavoriteTeam.test.ts) | delega o toggle de favorito para o repositório com os argumentos recebidos |
| grupos | [GetAllGroups.test.ts](../src/features/grupos/domain/usecases/GetAllGroups.test.ts) | delega a busca de todos os grupos para o repositório e retorna o resultado |
| auth | [makeAuth.test.ts](../src/features/auth/main/factories/makeAuth.test.ts) | delega o login para authRepositoryInstance com e-mail e senha |

### Infra — repositórios (SQLite / Firebase mockados)

**[SQLiteAlbumCatalogRepository.test.ts](../src/features/album/infra/repositories/SQLiteAlbumCatalogRepository.test.ts)**
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

**[FirebaseAuthRepository.test.ts](../src/features/auth/infra/repositories/FirebaseAuthRepository.test.ts)**
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

**[SQLiteTeamRepository.test.ts](../src/features/times/infra/repositories/SQLiteTeamRepository.test.ts)**
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

**[SQLiteMatchRepository.test.ts](../src/features/apostas/infra/repositories/SQLiteMatchRepository.test.ts)**
- `getUpcomingMatches`
  - consulta só partidas agendadas, ordenadas por data
- `getMatchById`
  - retorna null quando a partida não existe
  - partida agendada: gera odds e não expõe placar
  - partida finalizada: expõe o placar e não gera odds
  - partida ao vivo: sem odds e sem placar
  - usa "Fase de Grupos" como fallback quando não há group_label

**[SQLiteGroupRepository.test.ts](../src/features/grupos/infra/repositories/SQLiteGroupRepository.test.ts)**
- `getAllGroups`
  - busca os grupos e, para cada um, os standings ordenados por critério de desempate
  - deriva teamIds a partir dos standings de cada grupo
- `getGroupById`
  - lança erro quando o grupo não existe
  - mapeia o grupo e seus standings quando encontrado

**[FirestoreAlbumRepository.test.ts](../src/features/album/infra/repositories/FirestoreAlbumRepository.test.ts)**
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
- `buyStickerPack`
  - lança erro quando o saldo é insuficiente, sem gravar nada
  - deduz o custo do saldo e retorna 3 figurinhas sorteadas
- `buyIndividualSticker`
  - lança erro quando a figurinha não existe no catálogo
  - lança erro quando o saldo é insuficiente
  - compra com sucesso e carimba obtainedAt
- `grantStickers`
  - não grava nada quando todas as figurinhas já são possuídas
  - concede só as figurinhas que o usuário ainda não tem

---

## Verificação

- `npm test` deve rodar e passar após cada fase
- `npm run test:coverage` para acompanhar cobertura crescendo por fase (domain primeiro, depois infra)
