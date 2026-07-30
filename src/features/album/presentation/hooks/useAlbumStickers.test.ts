import { act, renderHook, waitFor } from '@testing-library/react-native';
import { makeSticker, makeUser } from '../../../../../test/fixtures';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';
import { makeGetAlbumById } from '../../main/factories/makeGetAlbumById';
import { makeGetAlbumStickers } from '../../main/factories/makeGetAlbumStickers';
import { makeGetUserCollection } from '../../main/factories/makeGetUserCollection';
import { useAlbumStickers } from './useAlbumStickers';

jest.mock('../../../../shared/presentation/contexts/UserContext', () => ({
  useCurrentUser: jest.fn(),
}));
jest.mock('../../main/factories/makeGetAlbumById', () => ({ makeGetAlbumById: jest.fn() }));
jest.mock('../../main/factories/makeGetAlbumStickers', () => ({ makeGetAlbumStickers: jest.fn() }));
jest.mock('../../main/factories/makeGetUserCollection', () => ({ makeGetUserCollection: jest.fn() }));

const getAlbumById = jest.fn();
const getAlbumStickers = jest.fn();
const getUserCollection = jest.fn();

const album = { id: 'a1', name: 'Copa 2026', price: 100 };

beforeEach(() => {
  jest.clearAllMocks();
  (makeGetAlbumById as jest.Mock).mockReturnValue({ execute: getAlbumById });
  (makeGetAlbumStickers as jest.Mock).mockReturnValue({ execute: getAlbumStickers });
  (makeGetUserCollection as jest.Mock).mockReturnValue({ execute: getUserCollection });
  (useCurrentUser as jest.Mock).mockReturnValue(makeUser());
  getAlbumById.mockResolvedValue(album);
  getAlbumStickers.mockResolvedValue([makeSticker({ id: 's1' }), makeSticker({ id: 's2' })]);
  getUserCollection.mockResolvedValue({
    userId: 'u1',
    albumId: 'a1',
    stickerIds: ['s1'],
    progress: 1,
  });
});

describe('useAlbumStickers', () => {
  it('busca álbum, figurinhas e coleção com os ids corretos', async () => {
    const { result } = renderHook(() => useAlbumStickers('a1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getAlbumById).toHaveBeenCalledWith('a1');
    expect(getAlbumStickers).toHaveBeenCalledWith('a1');
    expect(getUserCollection).toHaveBeenCalledWith('u1');
    expect(result.current.album).toEqual(album);
    expect(result.current.stickers).toHaveLength(2);
  });

  it('converte os ids da coleção em Set de possuídas', async () => {
    const { result } = renderHook(() => useAlbumStickers('a1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.ownedIds).toBeInstanceOf(Set);
    expect(result.current.ownedIds.has('s1')).toBe(true);
    expect(result.current.ownedIds.has('s2')).toBe(false);
  });

  it('começa com ownedIds vazio antes da busca resolver', async () => {
    const { result } = renderHook(() => useAlbumStickers('a1'));

    expect(result.current.ownedIds.size).toBe(0);
    expect(result.current.album).toBeNull();

    // deixa a busca inicial concluir para não vazar setState fora de act()
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('não busca nada sem usuário autenticado', async () => {
    (useCurrentUser as jest.Mock).mockReturnValue(null);

    renderHook(() => useAlbumStickers('a1'));

    await waitFor(() => expect(getAlbumById).not.toHaveBeenCalled());
  });

  it('rebusca quando o albumId muda', async () => {
    const { rerender } = renderHook(({ id }: { id: string }) => useAlbumStickers(id), {
      initialProps: { id: 'a1' },
    });
    await waitFor(() => expect(getAlbumById).toHaveBeenCalledWith('a1'));

    rerender({ id: 'a2' });

    await waitFor(() => expect(getAlbumById).toHaveBeenCalledWith('a2'));
    expect(getAlbumStickers).toHaveBeenCalledWith('a2');
  });

  it('guarda o erro quando alguma busca falha', async () => {
    getAlbumStickers.mockRejectedValue(new Error('álbum indisponível'));

    const { result } = renderHook(() => useAlbumStickers('a1'));

    await waitFor(() => expect(result.current.error).toBe('álbum indisponível'));
    expect(result.current.loading).toBe(false);
  });

  it('limpa o erro anterior ao refazer a busca com sucesso', async () => {
    getAlbumById.mockRejectedValueOnce(new Error('falha temporária'));
    const { result } = renderHook(() => useAlbumStickers('a1'));
    await waitFor(() => expect(result.current.error).toBe('falha temporária'));

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.album).toEqual(album);
  });
});
