import React from 'react';
import { Text } from 'react-native';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { useRouter, useSegments } from 'expo-router';
import { makeOnAuthStateChanged } from '../../../features/auth/main/factories/makeOnAuthStateChanged';
import { makeGetUserCoins } from '../../../features/album/main/factories/makeGetUserCoins';
import { FirebaseUser } from '../../../features/auth/domain/entities/FirebaseUser';
import {
  UserProvider,
  useAuthLoading,
  useCurrentUser,
  useRefreshCoins,
} from './UserContext';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useSegments: jest.fn(),
}));
jest.mock('../../../features/auth/main/factories/makeOnAuthStateChanged', () => ({
  makeOnAuthStateChanged: jest.fn(),
}));
jest.mock('../../../features/album/main/factories/makeGetUserCoins', () => ({
  makeGetUserCoins: jest.fn(),
}));

const onAuthStateChangedExecute = jest.fn();
const getUserCoinsExecute = jest.fn();
const replace = jest.fn();

let authCallback: (user: FirebaseUser | null) => void = () => {};
const unsubscribe = jest.fn();

const fbUser = (overrides: Partial<FirebaseUser> = {}): FirebaseUser => ({
  uid: 'u1',
  email: 'fulano@a.com',
  displayName: 'Fulano',
  isAnonymous: false,
  ...overrides,
});

/** Componente de sonda que expõe o contexto como texto renderizado. */
function Probe() {
  const user = useCurrentUser();
  const loading = useAuthLoading();
  const refreshCoins = useRefreshCoins();
  return (
    <>
      <Text testID="loading">{String(loading)}</Text>
      <Text testID="user">{user ? JSON.stringify(user) : 'null'}</Text>
      <Text testID="refresh" onPress={() => refreshCoins()}>refresh</Text>
    </>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ replace });
  (useSegments as jest.Mock).mockReturnValue(['(tabs)']);
  (makeOnAuthStateChanged as jest.Mock).mockReturnValue({
    execute: onAuthStateChangedExecute,
  });
  (makeGetUserCoins as jest.Mock).mockReturnValue({ execute: getUserCoinsExecute });
  onAuthStateChangedExecute.mockImplementation((cb: (user: FirebaseUser | null) => void) => {
    authCallback = cb;
    return unsubscribe;
  });
  getUserCoinsExecute.mockResolvedValue(100);
});

describe('UserProvider', () => {
  it('começa em loading com user null', () => {
    render(<UserProvider><Probe /></UserProvider>);

    expect(screen.getByTestId('loading').props.children).toBe('true');
    expect(screen.getByTestId('user').props.children).toBe('null');
  });

  it('encerra o loading com user null quando o Firebase reporta deslogado', async () => {
    render(<UserProvider><Probe /></UserProvider>);

    await act(async () => {
      authCallback(null);
    });

    expect(screen.getByTestId('loading').props.children).toBe('false');
    expect(screen.getByTestId('user').props.children).toBe('null');
  });

  describe('mapeamento FirebaseUser -> User (toUser)', () => {
    it('busca o saldo de moedas real no Firestore', async () => {
      render(<UserProvider><Probe /></UserProvider>);

      await act(async () => {
        authCallback(fbUser());
      });

      expect(getUserCoinsExecute).toHaveBeenCalledWith('u1');
      const user = JSON.parse(screen.getByTestId('user').props.children);
      expect(user.coins).toBe(100);
    });

    it('usa o displayName como nome quando presente', async () => {
      render(<UserProvider><Probe /></UserProvider>);

      await act(async () => {
        authCallback(fbUser({ displayName: 'Ciclano' }));
      });

      const user = JSON.parse(screen.getByTestId('user').props.children);
      expect(user.name).toBe('Ciclano');
    });

    it('cai para a parte local do email quando não há displayName', async () => {
      render(<UserProvider><Probe /></UserProvider>);

      await act(async () => {
        authCallback(fbUser({ displayName: null, email: 'beltrano@a.com' }));
      });

      const user = JSON.parse(screen.getByTestId('user').props.children);
      expect(user.name).toBe('beltrano');
    });

    it('cai para "Usuário" quando não há displayName nem email', async () => {
      render(<UserProvider><Probe /></UserProvider>);

      await act(async () => {
        authCallback(fbUser({ displayName: null, email: null }));
      });

      const user = JSON.parse(screen.getByTestId('user').props.children);
      expect(user.name).toBe('Usuário');
    });

    it('usa string vazia quando não há email', async () => {
      render(<UserProvider><Probe /></UserProvider>);

      await act(async () => {
        authCallback(fbUser({ email: null }));
      });

      const user = JSON.parse(screen.getByTestId('user').props.children);
      expect(user.email).toBe('');
    });

    it('inicia favoriteTeamIds vazio (resolvido separadamente)', async () => {
      render(<UserProvider><Probe /></UserProvider>);

      await act(async () => {
        authCallback(fbUser());
      });

      const user = JSON.parse(screen.getByTestId('user').props.children);
      expect(user.favoriteTeamIds).toEqual([]);
    });

    it('usa o uid do Firebase como id do usuário de domínio', async () => {
      render(<UserProvider><Probe /></UserProvider>);

      await act(async () => {
        authCallback(fbUser({ uid: 'uid-especial' }));
      });

      const user = JSON.parse(screen.getByTestId('user').props.children);
      expect(user.id).toBe('uid-especial');
    });
  });

  it('cancela a inscrição do Firebase Auth ao desmontar', () => {
    const { unmount } = render(<UserProvider><Probe /></UserProvider>);

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  describe('refreshCoins', () => {
    it('não faz nada sem usuário logado', async () => {
      render(<UserProvider><Probe /></UserProvider>);

      await act(async () => {
        screen.getByTestId('refresh').props.onPress();
      });

      expect(getUserCoinsExecute).not.toHaveBeenCalled();
    });

    it('busca o novo saldo e atualiza apenas coins, preservando o resto do usuário', async () => {
      render(<UserProvider><Probe /></UserProvider>);
      await act(async () => {
        authCallback(fbUser());
      });
      const antes = JSON.parse(screen.getByTestId('user').props.children);

      getUserCoinsExecute.mockResolvedValue(500);
      await act(async () => {
        screen.getByTestId('refresh').props.onPress();
      });

      const depois = JSON.parse(screen.getByTestId('user').props.children);
      expect(depois.coins).toBe(500);
      expect(depois).toEqual({ ...antes, coins: 500 });
    });
  });

  describe('AuthGuard', () => {
    it('não redireciona enquanto ainda está carregando o estado de auth', async () => {
      (useSegments as jest.Mock).mockReturnValue(['apostas']);

      render(<UserProvider><Probe /></UserProvider>);

      expect(replace).not.toHaveBeenCalled();
    });

    it('redireciona para /entrar quando não há usuário e a rota não é pública', async () => {
      (useSegments as jest.Mock).mockReturnValue(['apostas']);
      render(<UserProvider><Probe /></UserProvider>);

      await act(async () => {
        authCallback(null);
      });

      expect(replace).toHaveBeenCalledWith('/entrar');
    });

    it.each([
      ['(tabs)'], ['index'], ['times'], ['grupos'], ['players'],
      ['entrar'], ['cadastro'], ['esqueci-senha'],
    ])('não redireciona quando o segmento público %s está presente', async (segmento) => {
      (useSegments as jest.Mock).mockReturnValue([segmento]);
      render(<UserProvider><Probe /></UserProvider>);

      await act(async () => {
        authCallback(null);
      });

      expect(replace).not.toHaveBeenCalled();
    });

    it('não redireciona quando há usuário autenticado, mesmo em rota protegida', async () => {
      (useSegments as jest.Mock).mockReturnValue(['apostas']);
      render(<UserProvider><Probe /></UserProvider>);

      await act(async () => {
        authCallback(fbUser());
      });

      expect(replace).not.toHaveBeenCalled();
    });
  });

  /**
   * Comportamento atual documentado: o valor padrão do Context é `{}` (não
   * `null`/`undefined`), então o guard `if (!context) throw ...` em
   * useCurrentUser/useAuthLoading/useRefreshCoins nunca dispara — chamar esses
   * hooks fora de um UserProvider não lança, apenas devolve `undefined`.
   */
  describe('uso fora de um UserProvider (sem guard efetivo)', () => {
    function ProbeSemProvider() {
      const user = useCurrentUser();
      return <Text testID="user-sem-provider">{String(user)}</Text>;
    }

    it('useCurrentUser não lança fora do provider — devolve undefined', () => {
      render(<ProbeSemProvider />);

      expect(screen.getByTestId('user-sem-provider').props.children).toBe('undefined');
    });
  });
});
