jest.mock('../../main/factories/makeAuth', () => ({
  makeRegister: jest.fn(),
}));

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { makeRegister } from '../../main/factories/makeAuth';
import { useRegister } from './useRegister';

const execute = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (makeRegister as jest.Mock).mockReturnValue({ execute });
});

describe('useRegister', () => {
  it('começa sem loading e sem erro', () => {
    const { result } = renderHook(() => useRegister());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('repassa nome, email e senha para a factory e retorna true no sucesso', async () => {
    execute.mockResolvedValue({ uid: 'u1' });
    const { result } = renderHook(() => useRegister());

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.execute('Fulano', 'novo@a.com', 'senha123');
    });

    expect(execute).toHaveBeenCalledWith('Fulano', 'novo@a.com', 'senha123');
    expect(returned).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('mantém loading true enquanto o cadastro não resolve', async () => {
    let resolveRegister: (value: unknown) => void = () => {};
    execute.mockReturnValue(new Promise((resolve) => { resolveRegister = resolve; }));
    const { result } = renderHook(() => useRegister());

    act(() => {
      void result.current.execute('Fulano', 'novo@a.com', 'senha123');
    });

    await waitFor(() => expect(result.current.loading).toBe(true));

    await act(async () => {
      resolveRegister({ uid: 'u1' });
    });

    expect(result.current.loading).toBe(false);
  });

  it('limpa o erro anterior ao iniciar uma nova tentativa', async () => {
    execute.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });
    const { result } = renderHook(() => useRegister());

    await act(async () => {
      await result.current.execute('Fulano', 'usado@a.com', 'senha123');
    });
    expect(result.current.error).toBe('Este email já está em uso.');

    execute.mockResolvedValueOnce({ uid: 'u1' });
    await act(async () => {
      await result.current.execute('Fulano', 'novo@a.com', 'senha123');
    });

    expect(result.current.error).toBeNull();
  });

  describe('tradução dos códigos de erro do Firebase', () => {
    it.each([
      ['auth/email-already-in-use', 'Este email já está em uso.'],
      ['auth/invalid-email', 'Email inválido.'],
      ['auth/weak-password', 'Senha fraca. Use ao menos 6 caracteres.'],
      ['auth/network-request-failed', 'Sem conexão com a internet.'],
      ['auth/operation-not-allowed', 'Erro ao criar conta. Tente novamente.'],
    ])('traduz %s para a mensagem em português', async (code, expectedMessage) => {
      execute.mockRejectedValue({ code });
      const { result } = renderHook(() => useRegister());

      let returned: boolean | undefined;
      await act(async () => {
        returned = await result.current.execute('Fulano', 'novo@a.com', 'senha123');
      });

      expect(returned).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(expectedMessage);
    });

    it.each([
      ['Error sem code', new Error('boom')],
      ['string', 'boom'],
      ['null', null],
    ])('cai na mensagem genérica quando o erro é %s', async (_caso, thrown) => {
      execute.mockRejectedValue(thrown);
      const { result } = renderHook(() => useRegister());

      await act(async () => {
        await result.current.execute('Fulano', 'novo@a.com', 'senha123');
      });

      expect(result.current.error).toBe('Erro ao criar conta. Tente novamente.');
    });
  });
});
