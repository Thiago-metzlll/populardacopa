# Technical README: Arquitetura e Implementação

Este documento detalha as decisões técnicas, a estrutura arquitetural e as camadas já implementadas no aplicativo **Popular da Copa**. O projeto segue a abordagem **Clean Architecture** aliada ao **React Native**, **Expo Router** e **TypeScript**, visando testabilidade, separação de conceitos e facilidade de manutenção.

---

## 1. Visão Geral da Arquitetura

O projeto divide-se rigidamente em 4 camadas principais de responsabilidade. A Regra de Dependência impõe que o fluxo de conhecimento sempre aponte para o centro (Domain):

**`Presentation → Main → Use Cases (Domain) ← Infra`**

### Camada de Domain (O Coração)
Totalmente agnóstica de frameworks (sem dependências do React, React Native ou axios).
- **Entities:** Modelos de dados puros (interfaces/tipos do TypeScript). Exemplo: `Team`, `Group`, `Sticker`. Não possuem métodos ou classes atreladas.
- **Repositories (Interfaces):** Contratos que definem como as entidades são manipuladas e persistidas, sem se importar de onde vêm os dados.
- **Use Cases:** Abrigam a regra de negócio central da aplicação (ex: `GetUserProfile`, `ToggleFavoriteTeam`). Consomem estritamente as interfaces dos repositórios e possuem apenas uma responsabilidade (método `execute()`).

### Camada de Infra (A Borda Externa)
Responsável por implementar os contratos definidos pela camada de Domain.
- **Mock Repositories:** Classes que implementam as interfaces (`GroupRepository`, `TeamRepository`, `AlbumRepository`) utilizando estado em memória (`seeds`).
- **Simulação de API:** Todos os métodos de infraestrutura inserem um _delay_ assíncrono (usando Promises simulando de 300 a 500ms) para forçar as telas a lidarem corretamente com estados de `loading`.
- **Instâncias em Memória:** Para garantir a persistência de tela a tela, os repositórios mockados são criados usando o padrão **Singleton** localmente em seus respectivos módulos.

### Camada Main (O Composition Root)
O único lugar no projeto ciente de TODAS as implementações.
- **Factories:** Funções puras (ex: `makeGetAllGroups()`) encarregadas de instanciar os Repositories da Infra, instanciar o Use Case correspondente injetando essa dependência e retornar o Use Case montado.

### Camada de Presentation (A Interface do Usuário)
- **Hooks Customizados:** Arquivos como `useGroups.ts` encapsulam a reatividade (`useState` para data, loading, error) e orquestram a chamada às fábricas (`Main`), disparando as rotinas no `useEffect` ou mediante ações de usuário. Não usam Redux nem Zustand; toda a gerência fica local ao gancho + Context.
- **Context API:** `UserContext` providencia os dados fictícios do usuário logado transversalmente para todas as _features_.
- **Screens & Components:** Apenas renderização (Dumb/Presentational functions). Utilizam os Hooks para recuperar estado.
- **Navegação:** Roteamento baseado no file-system fornecido pelo **Expo Router**, com uso de uma Stack raiz para telas flutuantes (ex: Grupos) e Tabs (Home, Times, Perfil).

---

## 2. Features Implementadas

### Feature: `grupos`
- **Domain:** Modelagem de `Group` e `GroupStanding` (incluindo saldo de gols, vitórias e pontos). Use Case: `GetAllGroups`.
- **Infra:** Dois grupos gerados mockados com classificações ranqueadas.
- **Presentation:** `GroupsScreen` lista a classificação e pontos de cada equipe. Hook: `useGroups`.

### Feature: `album` (Perfil)
- **Domain:** Gerenciamento do progresso (`UserCollection`), do perfil geral (`Album`) e ordenação das figurinhas. Entidade `Sticker` configurada com propriedade de ordenação temporal explícita (`obtainedAt`).
- **Infra:** Seed gera automaticamente 100 figurinhas em uma relação pool e separa 78 para a carteira inicial do usuário simulado. Método `openPackage()` é responsável por pseudo-aleatorizar três stickers não obtidos e anexar ao perfil ativamente.
- **Presentation:** A `ProfileScreen` consome dois hooks paralelos (`useUserProfile` para fetch passivo e `useOpenPackage` para disparo ativo). Componentização da métrica `CardMinhaColecao`.

### Feature: `times`
- **Domain:** Regras para recuperar favoritos (`GetFavoriteTeams`), buscar (`SearchTeams`) e alternar estado (`ToggleFavoriteTeam`).
- **Infra:** 9 equipes pré-selecionadas de diversas nacionalidades, manipuláveis ativamente na memória por clique do usuário.
- **Presentation:** Input de buscas (`SearchInput`) contendo gerenciador de debounce interno e chamadas seguras. O estado reflete ativamente na lista.

### Shared & Root
- **`HomeScreen`:** Uma página convergente agindo como Hub que injeta componentes reciclados (`CardMinhaColecao`) via hooks combinados sem redeclarar dependências e atalhos de rotas unificadas.
- **Expo Router:** Layouts `_layout.tsx` distribuídos inteligentemente separando a estrutura das _tabs_ de rotas _stacked_.

---

## 3. Conformidade com o Planejamento Original (Aderência ao README)

O plano do `README.md` original era estruturar o sistema mantendo forte coerência nos contratos (`contracts`), na inversão de controle (`IoC`) e nos limites das _features_. 
Atualmente, as Features **Times**, **Grupos** e **Álbum** estão completas em todos os quadrantes listados no arquivo:
✅ Entidades Puras
✅ Repositórios (Interfaces)
✅ Casos de Uso
✅ Infra/Mocks e Seeds
✅ Telas (Presentation hooks, screens & routing)

O próximo foco técnico, conforme documentado no material raiz, repousará na construção do módulo transacional para a feature de `Apostas`, que envolverá relacionamentos de Partidas e Históricos de Palpites.
