jest.mock('../../main/factories/makeAuth', () => ({
  makeSignInWithEmail: jest.fn(),
}));

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { makeSignInWithEmail } from '../../main/factories/makeAuth';
import { useLogin } from './useLogin';

const execute = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (makeSignInWithEmail as jest.Mock).mockReturnValue({ execute });
});

describe('useLogin', () => {
  it('começa sem loading e sem erro', () => {
    const { result } = renderHook(() => useLogin());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('delega para a factory e retorna true no login bem-sucedido', async () => {
    execute.mockResolvedValue({ uid: 'u1' });
    const { result } = renderHook(() => useLogin());

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.execute('a@a.com', 'senha123');
    });

    expect(execute).toHaveBeenCalledWith('a@a.com', 'senha123');
    expect(returned).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('mantém loading true enquanto a requisição não resolve', async () => {
    let resolveLogin: (value: unknown) => void = () => {};
    execute.mockReturnValue(new Promise((resolve) => { resolveLogin = resolve; }));
    const { result } = renderHook(() => useLogin());

    act(() => {
      void result.current.execute('a@a.com', 'senha123');
    });

    await waitFor(() => expect(result.current.loading).toBe(true));

    await act(async () => {
      resolveLogin({ uid: 'u1' });
    });

    expect(result.current.loading).toBe(false);
  });

  it('limpa o erro anterior ao iniciar uma nova tentativa', async () => {
    execute.mockRejectedValueOnce({ code: 'auth/wrong-password' });
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.execute('a@a.com', 'errada');
    });
    expect(result.current.error).toBe('Email ou senha incorretos.');

    execute.mockResolvedValueOnce({ uid: 'u1' });
    await act(async () => {
      await result.current.execute('a@a.com', 'senha123');
    });

    expect(result.current.error).toBeNull();
  });

  describe('tradução dos códigos de erro do Firebase', () => {
    it.each([
      ['auth/invalid-credential', 'Email ou senha incorretos.'],
      ['auth/wrong-password', 'Email ou senha incorretos.'],
      ['auth/user-not-found', 'Email ou senha incorretos.'],
      ['auth/invalid-email', 'Email inválido.'],
      ['auth/too-many-requests', 'Muitas tentativas. Tente novamente mais tarde.'],
      ['auth/network-request-failed', 'Sem conexão com a internet.'],
      ['auth/internal-error', 'Erro ao fazer login. Tente novamente.'],
    ])('traduz %s para a mensagem em português', async (code, expectedMessage) => {
      execute.mockRejectedValue({ code });
      const { result } = renderHook(() => useLogin());

      let returned: boolean | undefined;
      await act(async () => {
        returned = await result.current.execute('a@a.com', 'senha123');
      });

      expect(returned).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(expectedMessage);
    });

    it.each([
      ['Error sem code', new Error('boom')],
      ['string', 'boom'],
      ['null', null],
      ['undefined', undefined],
    ])('cai na mensagem genérica quando o erro é %s', async (_caso, thrown) => {
      execute.mockRejectedValue(thrown);
      const { result } = renderHook(() => useLogin());

      await act(async () => {
        await result.current.execute('a@a.com', 'senha123');
      });

      expect(result.current.error).toBe('Erro ao fazer login. Tente novamente.');
    });
  });
});
