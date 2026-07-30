import { act, renderHook, waitFor } from '@testing-library/react-native';
import { makeSticker, makeUser } from '../../../../../test/fixtures';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';
import { makeGetStickersByIds } from '../../main/factories/makeGetStickersByIds';
import { makeGetUserCollection } from '../../main/factories/makeGetUserCollection';
import { useStickerDetail } from './useStickerDetail';

jest.mock('../../../../shared/presentation/contexts/UserContext', () => ({
  useCurrentUser: jest.fn(),
}));
jest.mock('../../main/factories/makeGetStickersByIds', () => ({ makeGetStickersByIds: jest.fn() }));
jest.mock('../../main/factories/makeGetUserCollection', () => ({ makeGetUserCollection: jest.fn() }));

const getStickersByIds = jest.fn();
const getUserCollection = jest.fn();

const collection = (stickerIds: string[]) => ({
  userId: 'u1',
  albumId: 'a1',
  stickerIds,
  progress: stickerIds.length,
});

beforeEach(() => {
  jest.clearAllMocks();
  (makeGetStickersByIds as jest.Mock).mockReturnValue({ execute: getStickersByIds });
  (makeGetUserCollection as jest.Mock).mockReturnValue({ execute: getUserCollection });
  (useCurrentUser as jest.Mock).mockReturnValue(makeUser());
  getStickersByIds.mockResolvedValue([makeSticker({ id: 's1' })]);
  getUserCollection.mockResolvedValue(collection(['s1']));
});

describe('useStickerDetail', () => {
  it('busca a figurinha pelo id em uma lista de um item', async () => {
    const { result } = renderHook(() => useStickerDetail('s1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getStickersByIds).toHaveBeenCalledWith(['s1']);
    expect(result.current.sticker?.id).toBe('s1');
  });

  describe('posse da figurinha', () => {
    it('marca owned quando o id está na coleção', async () => {
      getUserCollection.mockResolvedValue(collection(['s1', 's2']));

      const { result } = renderHook(() => useStickerDetail('s1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.owned).toBe(true);
    });

    it('marca owned como false quando o id não está na coleção', async () => {
      getUserCollection.mockResolvedValue(collection(['s2', 's3']));

      const { result } = renderHook(() => useStickerDetail('s1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.owned).toBe(false);
    });

    it('marca owned como false quando a coleção está vazia', async () => {
      getUserCollection.mockResolvedValue(collection([]));

      const { result } = renderHook(() => useStickerDetail('s1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.owned).toBe(false);
    });
  });

  it('deixa sticker em null quando o catálogo devolve lista vazia', async () => {
    getStickersByIds.mockResolvedValue([]);

    const { result } = renderHook(() => useStickerDetail('s-inexistente'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.sticker).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('usa apenas o primeiro item quando o catálogo devolve vários', async () => {
    getStickersByIds.mockResolvedValue([makeSticker({ id: 's1' }), makeSticker({ id: 's9' })]);

    const { result } = renderHook(() => useStickerDetail('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.sticker?.id).toBe('s1');
  });

  it('não busca nada sem usuário autenticado', async () => {
    (useCurrentUser as jest.Mock).mockReturnValue(null);

    renderHook(() => useStickerDetail('s1'));

    await waitFor(() => expect(getStickersByIds).not.toHaveBeenCalled());
  });

  it('rebusca quando o stickerId muda', async () => {
    const { rerender } = renderHook(({ id }: { id: string }) => useStickerDetail(id), {
      initialProps: { id: 's1' },
    });
    await waitFor(() => expect(getStickersByIds).toHaveBeenCalledWith(['s1']));

    rerender({ id: 's2' });

    await waitFor(() => expect(getStickersByIds).toHaveBeenCalledWith(['s2']));
  });

  it('guarda o erro quando a busca falha', async () => {
    getStickersByIds.mockRejectedValue(new Error('catálogo offline'));

    const { result } = renderHook(() => useStickerDetail('s1'));

    await waitFor(() => expect(result.current.error).toBe('catálogo offline'));
    expect(result.current.loading).toBe(false);
  });

  it('limpa o erro anterior no refetch', async () => {
    getStickersByIds.mockRejectedValueOnce(new Error('falha temporária'));
    const { result } = renderHook(() => useStickerDetail('s1'));
    await waitFor(() => expect(result.current.error).toBe('falha temporária'));

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.sticker?.id).toBe('s1');
  });
});
