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

## Fase 3 — Infra: repositórios (SQLite / Firestore mockados)

Sem banco real em ambiente Node — a estratégia é mockar o ponto de acesso ao driver (não o repositório inteiro), validando mapeamento linha→entidade e montagem de queries:

- [ ] `jest.mock` em [database.ts](../src/shared/infra/sqlite/database.ts) (`getSQLiteDb`), retornando um fake com `getFirstAsync`/`getAllAsync`/`runAsync` como `jest.fn()`
- [ ] Exemplo completo: [SQLiteAlbumCatalogRepository.ts](../src/features/album/infra/repositories/SQLiteAlbumCatalogRepository.ts) — `mapRowToSticker` (conversão `null`→`undefined`, cast de `rarity`), `getAlbumById` (lança erro quando não encontra), `getStickersByIds` (retorna `[]` sem consultar quando array vazio)
- [ ] Repositórios Firestore ([FirestoreAlbumRepository.ts](../src/features/album/infra/repositories/FirestoreAlbumRepository.ts), [FirebaseAuthRepository.ts](../src/features/auth/infra/repositories/FirebaseAuthRepository.ts)): mockar as funções importadas de `firebase/firestore`/`firebase/auth`
- [ ] Replicar o padrão para `SQLiteTeamRepository`, `SQLiteMatchRepository`, `SQLiteGroupRepository` conforme o tempo disponível

Repositórios Mock em memória (`MockTeamRepository`, `MockGroupRepository`, `MockPredictionRepository`) já são fakes — baixa prioridade.

---

## Fase 4 — Presentation: hooks (opcional, conforme tempo)

- [ ] Setup: `renderHook`/`act` do `@testing-library/react-native`, mock do módulo de factory (`jest.mock('../../main/factories/makeBuyStickerPack')`) e mock do `UserContext`
- [ ] Alvos representativos: [useBuyStickerPack.ts](../src/features/album/presentation/hooks/useBuyStickerPack.ts) (estados `loading`/`error`, chamada a `pendingPackStore` e `refreshCoins`), `useDailyCoinsReward`, `useUpcomingMatches`

## Fase 5 — Presentation: componentes/telas (fora do escopo inicial)

Maior atrito (mocks de Reanimated, SVG, `expo-image`, `expo-linear-gradient`) para menor retorno acadêmico. Só entra se sobrar tempo depois das fases 1–4.

---

## Verificação

- `npm test` deve rodar e passar após cada fase
- `npm run test:coverage` para acompanhar cobertura crescendo por fase (domain primeiro, depois infra)
