# `database/` — Seed de dados do SQLite

Este diretório contém os dados estáticos (times, jogadores, partidas da fase de
grupos) usados para popular o banco SQLite na primeira execução do app, via
[`migrations/001_initial.ts`](../src/shared/infra/sqlite/migrations/001_initial.ts).

Antes era um único arquivo `database.ts` na raiz (~345KB, ~12.8k linhas). Foi
dividido em quatro arquivos por conteúdo, mantendo os mesmos exports através de
um barrel (`index.ts`), então nenhum import existente precisou mudar:

| Arquivo | Conteúdo |
|---|---|
| `types.ts` | Tipos e interfaces do seed |
| `teams.ts` | `INITIAL_TEAMS` |
| `players.ts` | `AVAILABLE_PLAYERS` |
| `matches.ts` | `GROUPS` + geração da fase de grupos + `INITIAL_MATCHES` |
| `index.ts` | Barrel (`export * from './...'`) |

## Por que esses tipos não vivem em `src/features/*/domain`

Os tipos `Team`, `Player` e `Match` daqui **não são os mesmos** das entidades de
domínio (`src/features/times/domain/entities/Team.ts`,
`src/features/times/domain/entities/Player.ts`,
`src/features/apostas/domain/entities/Match.ts`). São propositalmente
diferentes:

- Representam o formato "cru" usado para inserir linhas nas tabelas SQLite
  (ex: `titles: string[]` vira `JSON.stringify(...)` antes de ir pro banco;
  `group` vira a coluna `group_key`).
- Têm campos que o domínio não tem (`flagUrl`, `subtitle`) e não têm campos que
  o domínio tem (`countryId`, `groupId`, `winRate`, `isFavorite`).
- `Player.number` aqui é `string` (ex.: `"GHA 27"`); no domínio é `number`.

Ou seja, o dado passa por uma transformação real entre o seed e a entidade de
domínio — não é uma duplicação acidental que valha a pena unificar. Misturar os
dois criaria acoplamento indevido entre o formato da migration e o formato que
a UI consome.

## Tipos (`types.ts`)

```ts
type PlayerPosition = 'GOL' | 'DEF' | 'MEI' | 'ATA' | 'ESCUDO' | 'SPECIAL';
type StickerType = 'BASE' | 'GOLD' | 'LEGEND';

interface Team {
  id: string;
  name: string;
  group: string;          // chave do grupo, ex: "A" — vira a coluna group_key
  flagUrl: string;
  subtitle?: string;
  ranking?: number;
  worldCupWins?: number;
  titles?: string[];      // serializado como JSON na tabela teams
  description?: string;
  isUnbeaten?: boolean;
}

interface Player {
  id: string;
  name: string;
  teamId: string;
  position: PlayerPosition;
  type: StickerType;       // raridade da figurinha desse jogador
  number: string;          // ex: "GHA 27" — número de camisa como texto livre
  imageUrl?: string;
}

interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  group: string;
  round: string;
  date: string;             // ISO string
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
}
```

## Dados estáticos

- **`teams.ts` → `INITIAL_TEAMS: Team[]`** — as seleções da Copa 2026, agrupadas
  em comentários por grupo (A a L).
- **`players.ts` → `AVAILABLE_PLAYERS: Player[]`** — elenco de jogadores por
  time, incluindo os jogadores "especiais"/escudo usados no álbum de
  figurinhas.
- **`matches.ts` → `GROUPS`** — lista fixa dos 12 grupos (`"A"` a `"L"`).

## Funções de geração (`matches.ts`)

Essas funções existem só para **construir a massa de dados mockada** da fase
de grupos a partir de `INITIAL_TEAMS`, uma única vez, no carregamento do
módulo. Não são regra de negócio do domínio (cálculo real de classificação
acontece depois, a partir das linhas do banco, em `001_initial.ts`).

### `generateRoundRobinRounds(items: Team[]): MatchPair[][]`

Gera as rodadas de um turno único (todos contra todos) usando o "método do
círculo" (circle method): fixa um time e roda os demais a cada rodada. Se o
número de times for ímpar, adiciona um "bye" fictício e descarta os confrontos
que envolveriam ele. Alterna mandante/visitante a cada rodada para distribuir
melhor os jogos em casa.

### `getFixtureScore(homeId, awayId): { homeScore, awayScore }`

Tabela fixa (`customScores`) com o placar "histórico" de cada confronto da fase
de grupos, indexado por `"{homeId}-{awayId}"`. Se o confronto for consultado na
ordem invertida, os placares são trocados automaticamente. Times/confrontos sem
entrada na tabela recebem `0 x 0`.

### `generateGroupStageMatches(teams: Team[]): Match[]`

Função principal: agrupa `teams` por `group`, gera as rodadas de cada grupo com
`generateRoundRobinRounds`, resolve o placar de cada jogo com
`getFixtureScore`, e monta o array final de `Match[]` com `id`, datas
sequenciais (a partir de `2026-06-11`, um dia por rodada) e `status:
'FINISHED'`. É o resultado exportado como `INITIAL_MATCHES`.

## Onde isso é usado

Apenas dois pontos de import consomem este diretório (via o barrel
`database/index.ts`):

- [`001_initial.ts`](../src/shared/infra/sqlite/migrations/001_initial.ts) —
  insere `INITIAL_TEAMS`, `AVAILABLE_PLAYERS` e `INITIAL_MATCHES` nas tabelas
  `teams`, `players` e `matches` na primeira migration.
- [`AlbumSeed.ts`](../src/features/album/infra/seed/AlbumSeed.ts) — usa
  `AVAILABLE_PLAYERS` para montar o catálogo de figurinhas do álbum.
