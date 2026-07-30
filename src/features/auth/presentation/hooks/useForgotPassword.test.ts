jest.mock('../../main/factories/makeResetPassword', () => ({
  makeResetPassword: jest.fn(),
}));

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { makeResetPassword } from '../../main/factories/makeResetPassword';
import { useForgotPassword } from './useForgotPassword';

const execute = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (makeResetPassword as jest.Mock).mockReturnValue({ execute });
});

describe('useForgotPassword', () => {
  it('começa sem loading, sem erro e sem email enviado', () => {
    const { result } = renderHook(() => useForgotPassword());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.sent).toBe(false);
  });

  it('marca sent como true e retorna true quando o email é enviado', async () => {
    execute.mockResolvedValue(undefined);
    const { result } = renderHook(() => useForgotPassword());

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.execute('a@a.com');
    });

    expect(execute).toHaveBeenCalledWith('a@a.com');
    expect(returned).toBe(true);
    expect(result.current.sent).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('mantém loading true e sent false enquanto o envio não resolve', async () => {
    let resolveSend: (value: unknown) => void = () => {};
    execute.mockReturnValue(new Promise((resolve) => { resolveSend = resolve; }));
    const { result } = renderHook(() => useForgotPassword());

    act(() => {
      void result.current.execute('a@a.com');
    });

    await waitFor(() => expect(result.current.loading).toBe(true));
    expect(result.current.sent).toBe(false);

    await act(async () => {
      resolveSend(undefined);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.sent).toBe(true);
  });

  it('volta sent para false ao reenviar após um sucesso', async () => {
    execute.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      await result.current.execute('a@a.com');
    });
    expect(result.current.sent).toBe(true);

    execute.mockRejectedValueOnce({ code: 'auth/user-not-found' });
    await act(async () => {
      await result.current.execute('inexistente@a.com');
    });

    expect(result.current.sent).toBe(false);
    expect(result.current.error).toBe('Email não encontrado.');
  });

  describe('tradução dos códigos de erro do Firebase', () => {
    it.each([
      ['auth/user-not-found', 'Email não encontrado.'],
      ['auth/invalid-email', 'Email não encontrado.'],
      ['auth/network-request-failed', 'Sem conexão com a internet.'],
      ['auth/too-many-requests', 'Erro ao enviar email. Tente novamente.'],
    ])('traduz %s para a mensagem em português', async (code, expectedMessage) => {
      execute.mockRejectedValue({ code });
      const { result } = renderHook(() => useForgotPassword());

      let returned: boolean | undefined;
      await act(async () => {
        returned = await result.current.execute('a@a.com');
      });

      expect(returned).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.sent).toBe(false);
      expect(result.current.error).toBe(expectedMessage);
    });

    it.each([
      ['Error sem code', new Error('boom')],
      ['string', 'boom'],
      ['null', null],
    ])('cai na mensagem genérica quando o erro é %s', async (_caso, thrown) => {
      execute.mockRejectedValue(thrown);
      const { result } = renderHook(() => useForgotPassword());

      await act(async () => {
        await result.current.execute('a@a.com');
      });

      expect(result.current.error).toBe('Erro ao enviar email. Tente novamente.');
    });
  });
});
