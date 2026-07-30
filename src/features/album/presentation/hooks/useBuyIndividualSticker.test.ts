import { act, renderHook } from '@testing-library/react-native';
import { makeSticker, makeUser } from '../../../../../test/fixtures';
import { useCurrentUser, useRefreshCoins } from '../../../../shared/presentation/contexts/UserContext';
import { makeBuyIndividualSticker } from '../../main/factories/makeBuyIndividualSticker';
import { useBuyIndividualSticker } from './useBuyIndividualSticker';

jest.mock('../../../../shared/presentation/contexts/UserContext', () => ({
  useCurrentUser: jest.fn(),
  useRefreshCoins: jest.fn(),
}));
jest.mock('../../main/factories/makeBuyIndividualSticker', () => ({
  makeBuyIndividualSticker: jest.fn(),
}));

const execute = jest.fn();
const refreshCoins = jest.fn();

const bought = makeSticker({ id: 's7', playerName: 'Ciclano' });

beforeEach(() => {
  jest.clearAllMocks();
  (makeBuyIndividualSticker as jest.Mock).mockReturnValue({ execute });
  (useCurrentUser as jest.Mock).mockReturnValue(makeUser());
  (useRefreshCoins as jest.Mock).mockReturnValue(refreshCoins);
  refreshCoins.mockResolvedValue(undefined);
  execute.mockResolvedValue(bought);
});

describe('useBuyIndividualSticker', () => {
  it('compra a figurinha com userId, stickerId e custo', async () => {
    const { result } = renderHook(() => useBuyIndividualSticker());

    let returned;
    await act(async () => {
      returned = await result.current.buySticker('s7', 50);
    });

    expect(execute).toHaveBeenCalledWith('u1', 's7', 50);
    expect(returned).toBe(bought);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('atualiza o saldo e avisa onSuccess na ordem certa', async () => {
    const ordem: string[] = [];
    refreshCoins.mockImplementation(async () => { ordem.push('refreshCoins'); });
    const onSuccess = jest.fn(() => { ordem.push('onSuccess'); });
    const { result } = renderHook(() => useBuyIndividualSticker(onSuccess));

    await act(async () => {
      await result.current.buySticker('s7', 50);
    });

    expect(onSuccess).toHaveBeenCalledWith(bought);
    expect(ordem).toEqual(['refreshCoins', 'onSuccess']);
  });

  it('não compra nada sem usuário autenticado', async () => {
    (useCurrentUser as jest.Mock).mockReturnValue(null);
    const { result } = renderHook(() => useBuyIndividualSticker());

    let returned;
    await act(async () => {
      returned = await result.current.buySticker('s7', 50);
    });

    expect(returned).toBeUndefined();
    expect(execute).not.toHaveBeenCalled();
    expect(refreshCoins).not.toHaveBeenCalled();
  });

  it('guarda o erro e não avisa onSuccess quando a compra falha', async () => {
    execute.mockRejectedValue(new Error('Figurinha já possuída'));
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useBuyIndividualSticker(onSuccess));

    let returned;
    await act(async () => {
      returned = await result.current.buySticker('s7', 50);
    });

    expect(returned).toBeUndefined();
    expect(result.current.error).toBe('Figurinha já possuída');
    expect(result.current.loading).toBe(false);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(refreshCoins).not.toHaveBeenCalled();
  });

  it('limpa o erro anterior numa nova tentativa', async () => {
    execute.mockRejectedValueOnce(new Error('Moedas insuficientes'));
    const { result } = renderHook(() => useBuyIndividualSticker());
    await act(async () => {
      await result.current.buySticker('s7', 50);
    });
    expect(result.current.error).toBe('Moedas insuficientes');

    await act(async () => {
      await result.current.buySticker('s7', 50);
    });

    expect(result.current.error).toBeNull();
  });
});
