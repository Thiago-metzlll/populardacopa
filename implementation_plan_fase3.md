# Implementation Plan — Fase 3: Player Profile, Prediction History & Pack Reveal

Este plano cobre a Fase 3 do app "Popular da Copa": Tela Jogador, Tela Histórico de Apostas e a Animação de Abrir Pacote, com seus respectivos componentes de arquitetura.

## User Review Required

### IMPORTANT — Dependências Bloqueantes

A Fase 3 depende de dois use cases de escrita que deveriam ter sido implementados na Fase 2:

- **`SavePrediction`** (use case + persistência mock) — sem isso não há dado para popular o histórico de apostas.
- **`BuyStickerPack`** (use case + persistência mock) — sem isso não há pacote para abrir/revelar.

Se esses ainda não existirem, tratar como **Fase 2.5** antes de seguir, ou incluir explicitamente neste escopo.

### Open Questions

1. Como o app trata predictions com `outcome: pendente` (partida em andamento) na Tela Histórico de Apostas? O Figma mostra esse terceiro estado, mas o fluxograma só cobre `CardVitoria`/`CardDerrota`.
2. `BuyStickerPack` (Fase 2) precisa ser redesenhado para retornar um `packId` navegável, em vez de resolver a compra inline?
3. Qual lib de animação já está no radar do projeto (se houver), para não introduzir uma dependência desnecessária?

---

## Proposed Changes

### Componente 1: Feature `players` (Tela Jogador)

**[MODIFY] Player.ts**
- Adicionar campos: `photoUrl: string`, `goals: number`, `assists: number`, `matchesPlayed: number`, `editionsPlayed: number`, `awards: string[]` (ex: `['ARTILHEIRO', 'MVP']`), `worldCupHistory: PlayerEditionRecord[]`.

**[NEW] PlayerEditionRecord.ts**
- Tipo/entidade auxiliar: `{ edition: string; team: string; result: string }` — para popular a seção "World Cup History" visível (cortada) no Figma.

**[MODIFY] PlayerSeed.ts**
- Popular os novos campos para os jogadores mock (`t1`–`t9`), incluindo ao menos um caso com múltiplos awards (Neymar com ARTILHEIRO + MVP) para validar o layout de badges múltiplos.

**[MODIFY] PlayerRepository.ts / MockPlayerRepository.ts**
- Adicionar `getById(playerId: string): Promise<Player>`.

**[NEW] GetPlayerById.ts + makeGetPlayerById.ts**
- Use case padrão, seguindo o mesmo formato do `GetTeamById` da Fase 2.

**[NEW] usePlayerDetail.ts**
- Hook retornando `{ player, loading, error }`.

**[NEW] CardCaracteristicas.tsx**
- Grid 2x2 (Gols, Assists, Matches, Editions), conforme fluxograma.

**[NEW] CardHistoricoMundial.tsx**
- Lista das participações em Copas (edição, seleção, resultado) — componente não coberto no fluxograma, mas necessário pela seção visível no Figma ("WORLD CUP HISTORY").

**[NEW] TelaJogador.tsx**
- Compõe header (foto, nome, número, país, badges) + `CardCaracteristicas` + `CardHistoricoMundial`.

**[NEW] app/players/[playerId].tsx**
- Rota shell do Expo Router.

**[MODIFY] MoldeJogadores.tsx** *(componente da Fase 2)*
- Adicionar `onPress` navegando para `players/[playerId]`.

---

### Componente 2: Feature `apostas` — Histórico (Tela Histórico de Apostas)

**[MODIFY] Prediction.ts** *(assumindo que a entidade já existe da Fase 2; se não, criar aqui)*
- Confirmar campos: `matchId`, `guessedHomeScore`, `guessedAwayScore`, `actualHomeScore`, `actualAwayScore`, `reward: string`, `outcome: 'vitoria' | 'perda' | 'pendente'`, `matchDate`, `stage` (ex: "Semifinais").

**[MODIFY] PredictionRepository.ts / MockPredictionRepository.ts**
- Adicionar `getHistory(userId: string): Promise<Prediction[]>`.

**[NEW] GetPredictionHistory.ts + makeGetPredictionHistory.ts**
- Use case de leitura do histórico completo.

**[NEW] useApostasHistorico.ts**
- Hook retornando `{ predictions, totalPalpites, winPercentage, loading, error }`.
- `totalPalpites` e `winPercentage` calculados no hook (ou em use case separado `GetPredictionStats`, se preferir manter regra de negócio fora da camada de apresentação — recomendado, já que % de vitória é regra de domínio, não detalhe de UI).

**[NEW] CardResumoApostas.tsx**
- Os dois cards do topo: "TOTAL DE PALPITES" e "PORCENTAGEM DE VITÓRIAS".

**[NEW] CardVitoria.tsx / CardDerrota.tsx**
- Conforme fluxograma — dois componentes distintos (não um único componente com variante condicional), exibindo placar, fase, recompensa e selo de resultado. Confirmar se a cor da borda (verde/laranja) é estilo do card ou prop `variant`.

**[NEW] TelaHistoricoApostas.tsx**
- Compõe `CardResumoApostas` + lista de `CardVitoria`/`CardDerrota` (renderização condicional por `outcome`).
- Tratar terceiro estado visível no Figma: partida "Em Andamento" (`outcome: pendente`) — não coberto no fluxograma. Ver Open Question #1.

**[NEW] app/apostas/historico.tsx**
- Rota shell (dentro da feature apostas, não modal).

**[MODIFY] ProfileScreen.tsx**
- Adicionar botão/link para o histórico.

---

### Componente 3: Feature `album` — Animação Abrir Pacote

**[NEW] RevealPack.ts + makeRevealPack.ts**
- Use case que recebe `packId` (ou resultado da compra feita em `BuyStickerPack`) e retorna a lista de figurinhas reveladas (`Sticker[]`).
- **Ponto de atenção**: pressupõe que `BuyStickerPack` já devolve ou referencia um conjunto de figurinhas a revelar — é o elo entre Fase 2 e Fase 3 que precisa estar bem definido no contrato do use case anterior.

**[NEW] useAbrirPacote.ts**
- Hook controlando o estado da animação: `{ stickers, isRevealing, currentIndex, reveal(), loading, error }`.

**[NEW] AnimacaoAbrirPacote.tsx**
- Componente de animação (sugestão: `react-native-reanimated`, caso não haja lib de animação já em uso — precisa entrar como dependência nova).

**[NEW] app/abrir-pacote/[packId].tsx**
- Rota modal, acionada logo após o `COMPRAR` da Tela Mercado (Fase 2).

**[MODIFY] TelaMercado.tsx** *(Fase 2)*
- Ajustar `onPress` do botão `COMPRAR` para, após `BuyStickerPack` resolver, navegar para `abrir-pacote/[packId]` em vez de apenas atualizar progresso in-place.

**[MOVE] CompartilhBtn.tsx** *(criado na Fase 2, sem lugar de uso claro até então)*
- Relocar uso principal para dentro da animação de reveal (compartilhar figurinha rara obtida).

---

### Infraestrutura & Dependências

**[MODIFY] package.json**
- Adicionar `react-native-reanimated` (ou lib equivalente já usada no projeto — confirmar com o agente antes de assumir) para a animação de abertura de pacote.

**[MODIFY] _layout.tsx**
- Registrar rotas `players/[playerId]`, `apostas/historico`, `abrir-pacote/[packId]`.

---

## Verification Plan

### Automated Tests
- Rodar `npx tsc --noEmit` e lint para verificar tipagem.

### Manual Verification
- **Tela Jogador**: navegar via card de jogador na Tela Time, conferir múltiplos badges e stats.
- **Histórico de Apostas**: conferir se o cálculo de % de vitória bate com a quantidade de cards de vitória/derrota exibidos.
- **Abrir Pacote**: comprar na Tela Mercado → verificar navegação automática para a animação → conferir que o progresso do álbum reflete as figurinhas reveladas.
