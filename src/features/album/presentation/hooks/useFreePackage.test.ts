import { act, renderHook, waitFor } from '@testing-library/react-native';
import { makeSticker, makeUser } from '../../../../../test/fixtures';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';
import { makeClaimFreePackage } from '../../main/factories/makeClaimFreePackage';
import { makeGetFreePackStatus } from '../../main/factories/makeGetFreePackStatus';
import { useFreePackage } from './useFreePackage';

jest.mock('../../../../shared/presentation/contexts/UserContext', () => ({
  useCurrentUser: jest.fn(),
}));
jest.mock('../../main/factories/makeGetFreePackStatus', () => ({ makeGetFreePackStatus: jest.fn() }));
jest.mock('../../main/factories/makeClaimFreePackage', () => ({ makeClaimFreePackage: jest.fn() }));

const getStatus = jest.fn();
const claimPack = jest.fn();

const disponivel = { available: true, nextAvailableAt: null };
const emCooldown = { available: false, nextAvailableAt: '2026-07-30T12:00:00.000Z' };
const ganhas = [makeSticker({ id: 's1' }), makeSticker({ id: 's2' }), makeSticker({ id: 's3' })];

beforeEach(() => {
  jest.clearAllMocks();
  (makeGetFreePackStatus as jest.Mock).mockReturnValue({ execute: getStatus });
  (makeClaimFreePackage as jest.Mock).mockReturnValue({ execute: claimPack });
  (useCurrentUser as jest.Mock).mockReturnValue(makeUser());
  getStatus.mockResolvedValue(disponivel);
  claimPack.mockResolvedValue(ganhas);
});

describe('useFreePackage', () => {
  it('busca o status do pacote grátis ao montar', async () => {
    const { result } = renderHook(() => useFreePackage());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getStatus).toHaveBeenCalledWith('u1');
    expect(result.current.status).toEqual(disponivel);
  });

  it('encerra o loading sem status quando não há usuário', async () => {
    (useCurrentUser as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useFreePackage());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.status).toBeNull();
    expect(getStatus).not.toHaveBeenCalled();
  });

  describe('claim', () => {
    it('devolve as figurinhas ganhas e rebusca o status', async () => {
      const { result } = renderHook(() => useFreePackage());
      await waitFor(() => expect(result.current.loading).toBe(false));
      getStatus.mockResolvedValue(emCooldown);

      let returned;
      await act(async () => {
        returned = await result.current.claim();
      });

      expect(claimPack).toHaveBeenCalledWith('u1');
      expect(returned).toBe(ganhas);
      expect(getStatus).toHaveBeenCalledTimes(2);
      expect(result.current.status).toEqual(emCooldown);
      expect(result.current.claiming).toBe(false);
    });

    it('não resgata nada sem usuário autenticado', async () => {
      (useCurrentUser as jest.Mock).mockReturnValue(null);
      const { result } = renderHook(() => useFreePackage());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let returned;
      await act(async () => {
        returned = await result.current.claim();
      });

      expect(returned).toBeUndefined();
      expect(claimPack).not.toHaveBeenCalled();
    });

    it('devolve undefined e guarda o erro quando o resgate falha', async () => {
      claimPack.mockRejectedValue(new Error('Pacote em cooldown'));
      const { result } = renderHook(() => useFreePackage());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let returned;
      await act(async () => {
        returned = await result.current.claim();
      });

      expect(returned).toBeUndefined();
      expect(result.current.error).toBe('Pacote em cooldown');
      expect(result.current.claiming).toBe(false);
    });

    it('não rebusca o status quando o resgate falha', async () => {
      claimPack.mockRejectedValue(new Error('Pacote em cooldown'));
      const { result } = renderHook(() => useFreePackage());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.claim();
      });

      expect(getStatus).toHaveBeenCalledTimes(1);
    });

    it('limpa o erro anterior num novo resgate', async () => {
      claimPack.mockRejectedValueOnce(new Error('falha temporária'));
      const { result } = renderHook(() => useFreePackage());
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

    const { result } = renderHook(() => useFreePackage());

    await waitFor(() => expect(result.current.error).toBe('status indisponível'));
    expect(result.current.loading).toBe(false);
  });
});
