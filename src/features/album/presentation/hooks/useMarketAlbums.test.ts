import { act, renderHook, waitFor } from '@testing-library/react-native';
import { makeUser } from '../../../../../test/fixtures';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';
import { makeGetMarketAlbums } from '../../main/factories/makeGetMarketAlbums';
import { makeGetUserCoins } from '../../main/factories/makeGetUserCoins';
import { useMarketAlbums } from './useMarketAlbums';

jest.mock('../../../../shared/presentation/contexts/UserContext', () => ({
  useCurrentUser: jest.fn(),
}));
jest.mock('../../main/factories/makeGetMarketAlbums', () => ({ makeGetMarketAlbums: jest.fn() }));
jest.mock('../../main/factories/makeGetUserCoins', () => ({ makeGetUserCoins: jest.fn() }));

const getMarketAlbums = jest.fn();
const getUserCoins = jest.fn();

const albums = [
  { id: 'a1', name: 'Copa 2026', price: 100 },
  { id: 'a2', name: 'Lendas', price: 250 },
];

beforeEach(() => {
  jest.clearAllMocks();
  (makeGetMarketAlbums as jest.Mock).mockReturnValue({ execute: getMarketAlbums });
  (makeGetUserCoins as jest.Mock).mockReturnValue({ execute: getUserCoins });
  (useCurrentUser as jest.Mock).mockReturnValue(makeUser());
  getMarketAlbums.mockResolvedValue(albums);
  getUserCoins.mockResolvedValue(500);
});

describe('useMarketAlbums', () => {
  it('busca álbuns e saldo de moedas do usuário', async () => {
    const { result } = renderHook(() => useMarketAlbums());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getMarketAlbums).toHaveBeenCalledWith('u1');
    expect(getUserCoins).toHaveBeenCalledWith('u1');
    expect(result.current.albums).toEqual(albums);
    expect(result.current.coins).toBe(500);
  });

  it('começa com lista vazia e zero moedas', async () => {
    const { result } = renderHook(() => useMarketAlbums());

    expect(result.current.albums).toEqual([]);
    expect(result.current.coins).toBe(0);
    expect(result.current.loading).toBe(true);

    // deixa a busca inicial concluir para não vazar setState fora de act()
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('não busca nada sem usuário autenticado', async () => {
    (useCurrentUser as jest.Mock).mockReturnValue(null);

    renderHook(() => useMarketAlbums());

    await waitFor(() => expect(getMarketAlbums).not.toHaveBeenCalled());
  });

  it('mantém coins em 0 quando o usuário não tem saldo', async () => {
    getUserCoins.mockResolvedValue(0);

    const { result } = renderHook(() => useMarketAlbums());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.coins).toBe(0);
  });

  it('guarda o erro quando a busca de moedas falha', async () => {
    getUserCoins.mockRejectedValue(new Error('saldo indisponível'));

    const { result } = renderHook(() => useMarketAlbums());

    await waitFor(() => expect(result.current.error).toBe('saldo indisponível'));
    expect(result.current.loading).toBe(false);
  });

  it('refetch atualiza o saldo depois de uma compra', async () => {
    const { result } = renderHook(() => useMarketAlbums());
    await waitFor(() => expect(result.current.coins).toBe(500));

    getUserCoins.mockResolvedValue(400);
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.coins).toBe(400);
  });
});
