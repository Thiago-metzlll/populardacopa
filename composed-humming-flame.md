# Plano: Autenticação (Firebase) + SQLite local (países/seleções)

## Contexto

A revisão de consistência do projeto encontrou duas lacunas entre a documentação (`technical-readme.md`) e o código:

1. **Auth**: `src/features/auth/` já tem domain + infra completos (`FirebaseAuthRepository`, factories em `makeAuth.ts`), mas nenhuma tela chama essas factories e `UserContext.tsx` retorna um usuário fixo (`id: 'u1'`). O backend de auth existe, mas está desconectado do app.
2. **SQLite**: a "Regra de Ouro" da doc (seção 10) promete SQLite local para dados estáticos (ex: países/seleções), mas `expo-sqlite` nunca foi instalado e não existe nenhum dado de país/confederação — as entidades `Country`/`Confederation` existem mas não têm seed nem repositório.

Decisões já validadas com o usuário:
- **Auth**: navegação livre — o app abre direto nas tabs; login só é pedido quando o usuário tenta uma ação que exige conta (salvar palpite, comprar/abrir pacote, favoritar time).
- **SQLite**: escopo inicial é só `countries`/`confederations` (que hoje não têm seed nenhum). Teams/Players/Groups continuam nos seeds em memória — volume pequeno (9 times, 15 jogadores, 2 grupos) e mexer neles envolveria destrinchar `Team.isFavorite` (dado de usuário) da tabela estática, o que fica para uma fase futura.

---

## Parte 1 — Autenticação

### 1.1 Persistência de sessão

`src/shared/infra/firebase/firebaseConfig.ts:3,35` usa `getAuth(app)` puro — sessão não sobrevive a restart do app. Trocar por `initializeAuth` com `getReactNativePersistence`, seguindo o mesmo padrão try/catch de singleton já usado para `db` (linhas 25-31):

```ts
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
...
let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch {
  auth = getAuth(app);
}
export { auth };
```

Requer instalar (com `npx expo install`, não `npm install`, para pegar a versão compatível com SDK 56):
```
npx expo install @react-native-async-storage/async-storage
```

### 1.2 Listener reativo de auth state

`AuthRepository` (`src/features/auth/domain/repositories/AuthRepository.ts`) não tem como notificar mudanças de sessão — só `getCurrentUser()` síncrono. Adicionar:

```ts
onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void;
```

Implementar em `FirebaseAuthRepository.ts` envolvendo o `onAuthStateChanged` do SDK, e expor via nova factory `makeOnAuthStateChanged.ts` em `src/features/auth/main/factories/`.

### 1.3 Repositório de perfil (shared)

`User` (`src/shared/domain/entities/User.ts`) tem `coins`/`favoriteTeamIds` que não existem em `FirebaseUser` — precisa vir do documento Firestore (`COLLECTIONS.USERS`, já usado por `FirebaseAuthRepository.ensureUserDocument` para criar o doc no login/cadastro). Como `User` é uma entidade **shared** (não de uma feature), criar a primeira camada Main/Infra em `src/shared/`, espelhando o padrão já usado em cada feature:

- `src/shared/domain/repositories/UserRepository.ts` — interface `getById(uid: string): Promise<User>`.
- `src/shared/infra/firebase/repositories/FirestoreUserRepository.ts` — lê `COLLECTIONS.USERS`/`USER_FIELDS` (já existentes em `collections.ts`) e mapeia para `User`.
- `src/shared/main/factories/repositoryInstance.ts` + `makeGetUserById.ts` — segue o singleton pattern de toda feature.

Isso respeita a regra do AGENTS.md ("Nunca importar Infra direto na Presentation — sempre via Main/factories"): `UserContext` não vai importar Firebase diretamente, só as factories de `auth` e `shared/main`.

### 1.4 `UserContext` real

Reescrever `src/shared/presentation/contexts/UserContext.tsx`:

```tsx
interface UserContextData {
  user: User | null;
  loading: boolean;
}
```

No `UserProvider`, assinar `makeOnAuthStateChanged().execute(...)` no `useEffect`: quando o Firebase emitir um `FirebaseUser`, chamar `makeGetUserById().execute(uid)` para montar o `User` completo; quando emitir `null`, `setUser(null)`. `loading` fica `true` só durante a resolução inicial da sessão persistida.

**Importante**: os hooks que já consomem `useCurrentUser()` (`useFavoriteTeams.ts:9,15`, `useCreatePrediction.ts:7,12`, `useOpenPackage`, `useBuyStickerPack`, `useMarketAlbums`, `usePredictionHistory`, `useUserProfile`, e os novos `useAlbumStickers`, `useAllStickers`, `useStickerDetail`, `useBuyIndividualSticker` das telas de Coleção/Figurinha Individual/Todas as Figurinhas) **já fazem `if (!user) return`** — não precisam mudar. O trabalho real é nas telas, que hoje não tratam o caso "usuário deslogado tentou uma ação".

### 1.5 Telas de Auth

- `src/shared/presentation/components/MoldeInputs/index.tsx` — componente de input compartilhado (doc seção 4/6), seguindo a receita visual de `SearchInput.tsx` (altura 48, `borderColor: colors.border`, `radius.md`, `colors.surface`), com label + estado de erro usando `colors.danger`.
- `src/features/auth/presentation/hooks/useLogin.ts` e `useRegister.ts` — hook `data|loading|error` padrão, chamando `makeSignInWithEmail`/`makeRegister`.
- `src/features/auth/presentation/screens/TelaEntrar.tsx` e `TelaCadastro.tsx` — usam `MoldeInputs` + os hooks acima; ao suceder, `router.back()` (o usuário retorna para onde estava e repete a ação).
- Rotas: `app/entrar.tsx` e `app/cadastro.tsx`, registradas como `Stack.Screen` modal em `app/_layout.tsx` (mesmo padrão de `apostas.tsx`/`grupos.tsx`).

### 1.6 Gate "sob demanda"

Padrão simples a repetir nos pontos de ação que exigem conta — checar `useCurrentUser()` e redirecionar antes de chamar o hook de mutação, em vez de deixar o `if (!user) return` do hook falhar silenciosamente. Aplicar em:
- `TelaPalpite.tsx:40` (`handleSave`) — antes de `createPrediction`.
- `useBuyStickerPack`/`TelaMercado.tsx` — antes de comprar pacote.
- `useFavoriteTeams.ts` (`toggleFavorite`) — no touch do coração/favorito em `TimesScreen`.
- `useBuyIndividualSticker`/`TelaCompraFigurinha.tsx` (`handleBuy`) — antes de comprar uma figurinha individual (tela adicionada no alinhamento com o Figma, mesmo requisito de conta que a compra de pacote).

Mesmo formato em cada um:
```ts
const user = useCurrentUser();
if (!user) { router.push('/entrar'); return; }
```

### 1.7 Perfil e logout

`ProfileScreen.tsx` precisa de estado "deslogado" (hoje assume usuário sempre presente) — mostrar CTA para `/entrar` quando `user === null`, e um botão "Sair" chamando `makeSignOut()` quando logado.

---

## Parte 2 — SQLite (países/seleções)

### 2.1 Dependência

```
npx expo install expo-sqlite
```
SDK ~56 usa a API assíncrona moderna (`openDatabaseAsync`, `runAsync`, `getAllAsync`) — não a legada baseada em `transaction`.

### 2.2 Dados reais a semear

As entidades `Country`/`Confederation` (`src/shared/domain/entities/`) hoje não têm nenhum seed. Os 9 `countryId` já usados em `TeamSeed.ts` (`br, ar, fr, de, es, gb, pt, it, uy`) definem exatamente o que semear — nada inventado:

| id | name | confederationId |
|---|---|---|
| br, ar, uy | Brasil, Argentina, Uruguai | conmebol |
| fr, de, es, gb, pt, it | França, Alemanha, Espanha, Inglaterra, Portugal, Itália | uefa |

Confederações: `conmebol` (América do Sul), `uefa` (Europa) — só essas duas, porque são as únicas referenciadas pelos times existentes.

Nota: `Country.flagUrl` fica vazio — as bandeiras já são resolvidas por `flagMap.ts` via SVG bundlado, não por URL. Não vou alterar esse mecanismo.

### 2.3 Infra

- `src/shared/infra/sqlite/database.ts` — `getDatabase()`: promise memoizada (`let dbPromise: Promise<SQLiteDatabase> | null`) que abre `populardacopa.db`, roda `CREATE TABLE IF NOT EXISTS countries/confederations` e semeia com `INSERT OR IGNORE` se vazio. Memoização evita reabrir/re-semear em cada chamada — mesmo espírito do singleton-guard de `firebaseConfig.ts`.
- `src/shared/infra/sqlite/repositories/SQLiteCountryRepository.ts` — implementa um único `CountryRepository` com métodos para país e confederação, no mesmo molde de `TeamRepository` (que já mistura Team + Player numa interface só).

### 2.4 Domain + Main

- `src/shared/domain/repositories/CountryRepository.ts`: `getAllCountries()`, `getCountryById(id)`, `getConfederationById(id)`.
- `src/shared/domain/usecases/GetAllCountries.ts`, `GetCountryById.ts` — `execute()` único, como todo use case do projeto.
- `src/shared/main/factories/repositoryInstance.ts` (singleton `countryRepositoryInstance`), `makeGetAllCountries.ts`, `makeGetCountryById.ts`.

### 2.5 Prova de vida (consumidor mínimo)

Para a migração não ficar inerte: em `TelaTime.tsx` (tela de detalhe do time), buscar o país via `makeGetCountryById(team.countryId)` e mostrar o nome completo + confederação junto ao ranking do time — um toque pequeno, não uma tela nova.

---

## Arquivos novos (resumo)

**Auth**: `firebaseConfig.ts` (edit), `AuthRepository.ts` (edit +1 método), `FirebaseAuthRepository.ts` (edit), `makeOnAuthStateChanged.ts`, `UserRepository.ts`, `FirestoreUserRepository.ts`, `shared/main/factories/{repositoryInstance,makeGetUserById}.ts`, `UserContext.tsx` (rewrite), `MoldeInputs/index.tsx`, `auth/presentation/hooks/{useLogin,useRegister}.ts`, `auth/presentation/screens/{TelaEntrar,TelaCadastro}.tsx`, `app/{entrar,cadastro}.tsx`, `app/_layout.tsx` (edit), + gate em `TelaPalpite.tsx`, `TelaMercado.tsx`/`useBuyStickerPack`, `useFavoriteTeams.ts`/`TimesScreen`, `ProfileScreen.tsx` (edit).

**SQLite**: `shared/infra/sqlite/database.ts`, `shared/infra/sqlite/repositories/SQLiteCountryRepository.ts`, `shared/domain/repositories/CountryRepository.ts`, `shared/domain/usecases/{GetAllCountries,GetCountryById}.ts`, `shared/main/factories/{repositoryInstance,makeGetAllCountries,makeGetCountryById}.ts`, `TelaTime.tsx` (edit pequeno).

## Verificação

**Auth**: `npx expo start` → deslogado, abrir `/palpite/[matchId]` e tentar confirmar palpite → deve redirecionar para `/entrar`; cadastrar conta nova → confirmar doc criado em `users/{uid}` no Firestore (pode reusar a tela `/firebase-test` já existente para inspecionar); voltar e confirmar o palpite com sucesso; fechar e reabrir o app → sessão deve persistir sem pedir login de novo; em Perfil, testar "Sair" e confirmar volta ao estado deslogado.

**SQLite**: `npx expo start --clear` (força primeira criação do banco) → abrir `Tela Time` de qualquer seleção → confirmar que nome do país e confederação aparecem corretamente (ex: Brasil → CONMEBOL). Opcionalmente inspecionar via `db.getAllAsync('SELECT * FROM countries')` num log temporário para confirmar as 9 linhas.
