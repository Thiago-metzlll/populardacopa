# Popular da Copa

App mobile para acompanhar a Copa do Mundo: times, grupos, coleção de figurinhas e palpites de partidas.

## Stack

- **React Native** + **Expo**
- **TypeScript**
- **Clean Architecture**

## Arquitetura

O projeto segue Clean Architecture com separação estrita de camadas. A regra de dependência é sempre em uma direção: `presentation → domain ← infra`.

```
domain/
  entities/       → contratos de dados puros (sem lógica, sem libs externas)
  repositories/   → interfaces que declaram o que a infra precisa implementar
  usecases/       → regras de negócio, dependem apenas da interface do repository

infra/
  repositories/   → implementações concretas (mock, API, etc.)
  seed/           → dados fake usados pelos mocks

presentation/      → telas e componentes (a construir)
```

Use cases nunca dependem de implementação concreta — apenas da interface do repository. Isso permite trocar mock por API real sem alterar nenhuma regra de negócio.

### Convenções

- Datas são sempre `string` em formato ISO no domain; formatação fica na camada de apresentação.
- Entidades pequenas que só existem em função de outra ficam agrupadas no mesmo arquivo (ex: `Match` + `MatchOdds`).
- Mocks simulam latência de rede (300–500ms) e mantêm estado em memória — os dados resetam a cada reload (comportamento aceito nesta fase do projeto).

## Estrutura de pastas

```
src/
  shared/
    domain/
      entities/       → Country, Confederation, User

  features/
    times/
      domain/
        entities/     → Team, Player, PlayerStats
        repositories/ → TeamRepository
        usecases/     → GetFavoriteTeams, SearchTeams, ToggleFavoriteTeam
      infra/
        repositories/ → MockTeamRepository
        seed/         → TeamSeed

    grupos/
      domain/
        entities/     → Group, GroupStanding
        repositories/ → GroupRepository
        usecases/     → GetAllGroups
      infra/
        repositories/ → MockGroupRepository
        seed/         → GroupSeed

    album/
      domain/
        entities/     → Sticker, Album, UserCollection, Package
        repositories/ → AlbumRepository
        usecases/     → GetUserProfile, OpenPackage
      infra/
        repositories/ → MockAlbumRepository
        seed/         → AlbumSeed

    apostas/
      domain/
        entities/     → Match, MatchOdds, Prediction, PredictionReward, PredictionHistory
        repositories/ → (a definir)
        usecases/     → (a definir)
      infra/
        (a definir)
```

## Status atual

| Feature  | Entities | Repository (interface) | Use Cases | Infra (mock) | Telas |
|----------|:--------:|:-----------------------:|:---------:|:-------------:|:-----:|
| times    | ✅ | ✅ | ✅ | ✅ | ⬜ |
| grupos   | ✅ | ✅ | ✅ | ✅ | ⬜ |
| album    | ✅ | ✅ | ✅ | ✅ | ⬜ |
| apostas  | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |

Próximos passos: definir repository/use cases de `apostas` (Match + Prediction), depois a tela de Palpite como derivada da tela Apostas, e então iniciar a camada de presentation para as 4 telas já modeladas: Grupos, Perfil, Times e Apostas.

## Como rodar

```bash
npm install
npx expo start
```

## Notas de modelagem

- **Palpite vs Aposta**: "Aposta" é a feature/tela que agrega partidas apostáveis (com odds) e histórico. "Palpite" (`Prediction`) é a entidade real — a previsão de placar do usuário para uma partida específica.
- **Tela Times** exibe apenas os times favoritados do usuário (`GetFavoriteTeams`), não a lista completa de seleções.
- A Tela Apostas exige autenticação para o usuário efetivamente apostar (gate de login na UI); isso ainda não está refletido no domain e deve ser tratado na camada de presentation/rota.
