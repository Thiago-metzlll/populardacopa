import { act, renderHook, waitFor } from '@testing-library/react-native';
import { makeUser } from '../../../../../test/fixtures';
import { useCurrentUser, useRefreshCoins } from '../../../../shared/presentation/contexts/UserContext';
import { makeClaimDailyCoins } from '../../main/factories/makeClaimDailyCoins';
import { makeGetDailyCoinsStatus } from '../../main/factories/makeGetDailyCoinsStatus';
import { useDailyCoinsReward } from './useDailyCoinsReward';

jest.mock('../../../../shared/presentation/contexts/UserContext', () => ({
  useCurrentUser: jest.fn(),
  useRefreshCoins: jest.fn(),
}));
jest.mock('../../main/factories/makeGetDailyCoinsStatus', () => ({
  makeGetDailyCoinsStatus: jest.fn(),
}));
jest.mock('../../main/factories/makeClaimDailyCoins', () => ({ makeClaimDailyCoins: jest.fn() }));

const getStatus = jest.fn();
const claimCoins = jest.fn();
const refreshCoins = jest.fn();

const disponivel = { available: true, nextAvailableAt: null, amount: 50 };
const emCooldown = { available: false, nextAvailableAt: '2026-07-30T12:00:00.000Z', amount: 50 };

beforeEach(() => {
  jest.clearAllMocks();
  (makeGetDailyCoinsStatus as jest.Mock).mockReturnValue({ execute: getStatus });
  (makeClaimDailyCoins as jest.Mock).mockReturnValue({ execute: claimCoins });
  (useCurrentUser as jest.Mock).mockReturnValue(makeUser());
  (useRefreshCoins as jest.Mock).mockReturnValue(refreshCoins);
  refreshCoins.mockResolvedValue(undefined);
  getStatus.mockResolvedValue(disponivel);
  claimCoins.mockResolvedValue(50);
});

describe('useDailyCoinsReward', () => {
  it('busca o status da recompensa ao montar', async () => {
    const { result } = renderHook(() => useDailyCoinsReward());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getStatus).toHaveBeenCalledWith('u1');
    expect(result.current.status).toEqual(disponivel);
  });

  it('encerra o loading sem status quando não há usuário', async () => {
    (useCurrentUser as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useDailyCoinsReward());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.status).toBeNull();
    expect(getStatus).not.toHaveBeenCalled();
  });

  describe('claim', () => {
    it('resgata, atualiza as moedas do contexto e rebusca o status', async () => {
      const { result } = renderHook(() => useDailyCoinsReward());
      await waitFor(() => expect(result.current.loading).toBe(false));
      getStatus.mockResolvedValue(emCooldown);

      await act(async () => {
        await result.current.claim();
      });

      expect(claimCoins).toHaveBeenCalledWith('u1');
      expect(refreshCoins).toHaveBeenCalledTimes(1);
      expect(getStatus).toHaveBeenCalledTimes(2);
      expect(result.current.status).toEqual(emCooldown);
    });

    it('devolve o valor resgatado', async () => {
      const { result } = renderHook(() => useDailyCoinsReward());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let returned;
      await act(async () => {
        returned = await result.current.claim();
      });

      expect(returned).toBe(50);
      expect(result.current.claiming).toBe(false);
    });

    it('não resgata nada sem usuário autenticado', async () => {
      (useCurrentUser as jest.Mock).mockReturnValue(null);
      const { result } = renderHook(() => useDailyCoinsReward());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let returned;
      await act(async () => {
        returned = await result.current.claim();
      });

      expect(returned).toBeUndefined();
      expect(claimCoins).not.toHaveBeenCalled();
    });

    it('guarda o erro e não atualiza as moedas quando o resgate falha', async () => {
      claimCoins.mockRejectedValue(new Error('Recompensa em cooldown'));
      const { result } = renderHook(() => useDailyCoinsReward());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.claim();
      });

      expect(result.current.error).toBe('Recompensa em cooldown');
      expect(result.current.claiming).toBe(false);
      expect(refreshCoins).not.toHaveBeenCalled();
    });

    it('limpa o erro anterior num novo resgate', async () => {
      claimCoins.mockRejectedValueOnce(new Error('falha temporária'));
      const { result } = renderHook(() => useDailyCoinsReward());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => {
        await result.current.claim();
      });
      expect(result.current.error).toBe('falha temporária');

      await act(async () => {
        await result.current.claim();
      });

      expect(result.current.error).toBeNull();
    });
  });

  it('guarda o erro quando a busca de status falha', async () => {
    getStatus.mockRejectedValue(new Error('status indisponível'));

    const { result } = renderHook(() => useDailyCoinsReward());

    await waitFor(() => expect(result.current.error).toBe('status indisponível'));
    expect(result.current.loading).toBe(false);
    expect(result.current.status).toBeNull();
  });
});
