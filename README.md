# Popular da Copa

**Popular da Copa** é um aplicativo mobile para torcedores acompanharem a Copa do Mundo com engajamento ativo: visualize grupos e classificações, gerencie seus times favoritos, colecione figurinhas digitais e dê palpites nas partidas para ganhar moedas virtuais ou figurinhas. Não envolve dinheiro real — é um sistema de recompensas e colecionismo, não uma casa de apostas.

---

## O que o app faz

O aplicativo é organizado em quatro pilares de funcionalidade principais (Grupos, Perfil/Álbum, Times, Apostas), precedidos por um fluxo de autenticação e uma Home centralizada, com uma economia de moedas e recompensas diárias entrelaçada entre eles:

### Grupos
Exibe a tabela de cada grupo da Copa (pontuação, saldo de gols, vitórias/empates/derrotas), refletindo o estado atual do torneio.

### Perfil & Álbum de Figurinhas
Hub da coleção pessoal. O usuário vê seu progresso via `CardColeção`, pode visitar o Mercado de Figurinhas para trocar duplicatas, abrir pacotes com animação e compartilhar figurinhas via `CompartilhBtn`.

### Times
Grid de 2 colunas com a bandeira (SVG) de cada seleção, ranking e destaque para favoritos, com `SearchInput` para busca com debounce. Times favoritos (quando logado) aparecem em uma seção própria acima da lista completa. Uma tela de detalhes do time exibe conquistas (`CardConquistas`) e o molde de jogadores (`MoldeJogadores`). Ao tocar em um jogador, abre a tela com `CardCaracterísticas`.

### Apostas & Palpites
Lista as próximas partidas. O usuário confirma um palpite pela Tela Palpite, ganhando moedas ou figurinhas específicas se acertar o placar. Ao reabrir a tela de Apostas, palpites pendentes cujas partidas já terminaram são resolvidos automaticamente (settlement client-side) e a recompensa é creditada; resultados ficam disponíveis na Tela Histórico de Apostas.

### Moedas e recompensas diárias
Moedas ficam salvas no Firestore por usuário. Todo dia o usuário pode resgatar uma recompensa de moedas e um pacote de figurinhas grátis (um de cada por período de 24h desde o último resgate), disponíveis como cards na tela de Perfil.

---

## Fases de construção (planejadas no grafo)

O grafo define **5 fases** de implementação, da mais simples à mais complexa:

### Fase 1 — Telas principais
> Antes de qualquer construção visual, os use cases de cada tela são implementados primeiro.

| Tela | Use cases / Componentes chave |
|---|---|
| Tela Grupos | Use cases, Componentes |
| Tela Perfil (com as figurinhas) | Use cases, Componentes ↔ `CardColeção` |
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



## Arquitetura de Dados (Nuvem vs Local)

Para otimização de performance e custos, os dados são divididos seguindo a seguinte regra:

| Critério | Vai pra onde |
| --- | --- |
| Dado estático, igual pra todos os usuários, não muda durante o projeto | **SQLite local** (Ex: lista de países, regras, informações globais) |
| Dado que pertence a um usuário específico, ou muda com o tempo | **Firestore (nuvem)** (Ex: progresso, figurinhas, moedas, palpites) |

> **Nota sobre o Firestore**: Ao inicializar o Firebase SDK v12, foi necessário declarar o database ID como `'default'` (sem parênteses) explicitamente no `initializeFirestore` para evitar o erro `Database '(default)' not found`.

---

## Status de implementação

### Domain + Infra

| Feature | Entities | Repository | Use Cases | Infra/Mock |
|---------|:--------:|:----------:|:---------:|:----------:|
| grupos  | ✅ | ✅ | ✅ | ✅ |
| times   | ✅ | ✅ | ✅ | ✅ |
| album   | ✅ | ✅ | ✅ | ✅ |
| apostas | ✅ | ✅ | ✅ | ✅ |
| auth    | ✅ | ✅ | ✅ | ✅ |

### Presentation — por fase do grafo

| Fase | Tela / Componente | Status |
|------|---|---|
| **Fase 1** | GroupsScreen | ✅ |
| **Fase 1** | ProfileScreen + CardColeção | ✅ |
| **Fase 1** | TimesScreen + SearchInput | ✅ |
| **Fase 1** | ApostasScreen + ContainerAposta + BotaoHistorico | ✅ |
| **Fase 2** | Tela Mercado de Figurinhas + CompartilhBtn | ✅ |
| **Fase 2** | Tela Time + CardConquistas + MoldeJogadores | ✅ |
| **Fase 2** | Tela Palpite | ✅ |
| **Fase 3** | Animação Abrir Pacote | ✅ |
| **Fase 3** | Tela Jogador + CardCaracterísticas | ✅ |
| **Fase 3** | Tela Histórico de Apostas | ✅ |
| **Fase 4** | Tela Entrar + Tela Cadastro + Tela Esqueci Senha + MoldeInputs | ✅ |
| **Fase 5** | Tela Home + MoldeCardHome + CardPartida | ⬜ (HomeScreen atual é um hub funcional, não a versão definitiva do grafo) |
| **Global** | CardFigurinha, MolduraIndividualPaís, BotãoHomeMolde, CardColeção, PalpiteBtn | ✅ |
| **Global** | NavBar, MenuBar | ✅ |

---

## Como rodar

```bash
npm install
npx expo start
```

---

## Convenções

- **Datas** são sempre `string` ISO no domain; formatação fica na apresentação.
- **Entidades coesas** que só existem em função de outra ficam no mesmo arquivo (ex: `Match` + `MatchOdds`).
- **Mocks simulam latência** de 300–500ms para forçar correto tratamento de `loading`.
- **Estado em memória**: dados resetam a cada reload — aceito nesta fase.
- **Palpite vs Aposta**: "Aposta" é a feature/tela. "Palpite" (`Prediction`) é a entidade — previsão de resultado do usuário.
- **Tela Times** exibe a lista global de seleções em grid; favoritos (`GetFavoriteTeams`) aparecem em seção própria quando o usuário está logado.
- **Use case antes da tela**: conforme o grafo, o use case de cada tela é construído antes da interface visual.
- **Sem emojis em UI**: todo ícone visual usa `Ionicons` (`@expo/vector-icons`), nunca caractere emoji cru em `<Text>`.

---

Para mais detalhes sobre a arquitetura, convenções adicionais e estrutura de pastas do projeto, consulte a [Documentação Técnica](docs/technical-readme.md).
