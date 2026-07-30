import { act, renderHook } from '@testing-library/react-native';
import { makeSticker, makeUser } from '../../../../../test/fixtures';
import { useCurrentUser, useRefreshCoins } from '../../../../shared/presentation/contexts/UserContext';
import { pendingPackStore } from '../../infra/stores/pendingPackStore';
import { makeBuyStickerPack } from '../../main/factories/makeBuyStickerPack';
import { useBuyStickerPack } from './useBuyStickerPack';

jest.mock('../../../../shared/presentation/contexts/UserContext', () => ({
  useCurrentUser: jest.fn(),
  useRefreshCoins: jest.fn(),
}));
jest.mock('../../main/factories/makeBuyStickerPack', () => ({ makeBuyStickerPack: jest.fn() }));

const execute = jest.fn();
const refreshCoins = jest.fn();

const stickers = [makeSticker({ id: 's1' }), makeSticker({ id: 's2' })];
const buyResult = { packId: 'pack-1', stickers, remainingCoins: 400 };

beforeEach(() => {
  jest.clearAllMocks();
  pendingPackStore.clear('pack-1');
  (makeBuyStickerPack as jest.Mock).mockReturnValue({ execute });
  (useCurrentUser as jest.Mock).mockReturnValue(makeUser());
  (useRefreshCoins as jest.Mock).mockReturnValue(refreshCoins);
  refreshCoins.mockResolvedValue(undefined);
  execute.mockResolvedValue(buyResult);
});

afterEach(() => {
  pendingPackStore.clear('pack-1');
});

describe('useBuyStickerPack', () => {
  it('começa sem loading e sem erro', () => {
    const { result } = renderHook(() => useBuyStickerPack());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('compra o pacote com userId, albumId e custo', async () => {
    const { result } = renderHook(() => useBuyStickerPack());

    let returned;
    await act(async () => {
      returned = await result.current.buyPack('a1', 100);
    });

    expect(execute).toHaveBeenCalledWith('u1', 'a1', 100);
    expect(returned).toBe(buyResult);
    expect(result.current.loading).toBe(false);
  });

  it('grava as figurinhas no pendingPackStore para evitar double-draw', async () => {
    const { result } = renderHook(() => useBuyStickerPack());

    await act(async () => {
      await result.current.buyPack('a1', 100);
    });

    expect(pendingPackStore.has('pack-1')).toBe(true);
    expect(pendingPackStore.get('pack-1')).toBe(stickers);
  });

  it('atualiza o saldo de moedas do contexto após a compra', async () => {
    const { result } = renderHook(() => useBuyStickerPack());

    await act(async () => {
      await result.current.buyPack('a1', 100);
    });

    expect(refreshCoins).toHaveBeenCalledTimes(1);
  });

  it('chama onSuccess com o resultado da compra', async () => {
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useBuyStickerPack(onSuccess));

    await act(async () => {
      await result.current.buyPack('a1', 100);
    });

    expect(onSuccess).toHaveBeenCalledWith(buyResult);
  });

  it('funciona sem onSuccess', async () => {
    const { result } = renderHook(() => useBuyStickerPack());

    await act(async () => {
      await result.current.buyPack('a1', 100);
    });

    expect(result.current.error).toBeNull();
  });

  it('não compra nada e devolve undefined sem usuário autenticado', async () => {
    (useCurrentUser as jest.Mock).mockReturnValue(null);
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useBuyStickerPack(onSuccess));

    let returned;
    await act(async () => {
      returned = await result.current.buyPack('a1', 100);
    });

    expect(returned).toBeUndefined();
    expect(execute).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  describe('falha na compra', () => {
    beforeEach(() => {
      execute.mockRejectedValue(new Error('Moedas insuficientes'));
    });

    it('guarda a mensagem de erro e devolve undefined', async () => {
      const { result } = renderHook(() => useBuyStickerPack());

      let returned;
      await act(async () => {
        returned = await result.current.buyPack('a1', 100);
      });

      expect(returned).toBeUndefined();
      expect(result.current.error).toBe('Moedas insuficientes');
      expect(result.current.loading).toBe(false);
    });

    it('não grava no store, não atualiza moedas nem chama onSuccess', async () => {
      const onSuccess = jest.fn();
      const { result } = renderHook(() => useBuyStickerPack(onSuccess));

      await act(async () => {
        await result.current.buyPack('a1', 100);
      });

      expect(pendingPackStore.has('pack-1')).toBe(false);
      expect(refreshCoins).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('limpa o erro anterior numa nova tentativa', async () => {
      const { result } = renderHook(() => useBuyStickerPack());
      await act(async () => {
        await result.current.buyPack('a1', 100);
      });
      expect(result.current.error).toBe('Moedas insuficientes');

      execute.mockResolvedValue(buyResult);
      await act(async () => {
        await result.current.buyPack('a1', 100);
      });

      expect(result.current.error).toBeNull();
    });
  });
});
