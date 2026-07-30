import { act, renderHook, waitFor } from '@testing-library/react-native';
import { makeSticker, makeUser } from '../../../../../test/fixtures';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';
import { makeGetAllStickers } from '../../main/factories/makeGetAllStickers';
import { makeGetUserCollection } from '../../main/factories/makeGetUserCollection';
import { useAllStickers } from './useAllStickers';

jest.mock('../../../../shared/presentation/contexts/UserContext', () => ({
  useCurrentUser: jest.fn(),
}));
jest.mock('../../main/factories/makeGetAllStickers', () => ({
  makeGetAllStickers: jest.fn(),
}));
jest.mock('../../main/factories/makeGetUserCollection', () => ({
  makeGetUserCollection: jest.fn(),
}));

const getAllStickers = jest.fn();
const getUserCollection = jest.fn();

const collection = (stickerIds: string[]) => ({
  userId: 'u1',
  albumId: 'a1',
  stickerIds,
  progress: stickerIds.length,
});

beforeEach(() => {
  jest.clearAllMocks();
  (makeGetAllStickers as jest.Mock).mockReturnValue({ execute: getAllStickers });
  (makeGetUserCollection as jest.Mock).mockReturnValue({ execute: getUserCollection });
  (useCurrentUser as jest.Mock).mockReturnValue(makeUser());
  getAllStickers.mockResolvedValue([]);
  getUserCollection.mockResolvedValue(collection([]));
});

describe('useAllStickers', () => {
  it('busca catálogo e coleção em paralelo ao montar', async () => {
    const { result } = renderHook(() => useAllStickers());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getAllStickers).toHaveBeenCalledTimes(1);
    expect(getUserCollection).toHaveBeenCalledWith('u1');
  });

  it('não busca nada sem usuário autenticado', async () => {
    (useCurrentUser as jest.Mock).mockReturnValue(null);

    renderHook(() => useAllStickers());

    await waitFor(() => expect(getAllStickers).not.toHaveBeenCalled());
  });

  describe('agrupamento por raridade', () => {
    beforeEach(() => {
      getAllStickers.mockResolvedValue([
        makeSticker({ id: 's1', rarity: 'comum' }),
        makeSticker({ id: 's2', rarity: 'comum' }),
        makeSticker({ id: 's3', rarity: 'rara' }),
        makeSticker({ id: 's4', rarity: 'lendaria' }),
        makeSticker({ id: 's5', rarity: 'lendaria' }),
      ]);
      getUserCollection.mockResolvedValue(collection(['s1', 's4']));
    });

    it('ordena as seções de lendária para comum', async () => {
      const { result } = renderHook(() => useAllStickers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.sections.map((s) => s.rarity)).toEqual(['lendaria', 'rara', 'comum']);
    });

    it('conta o total de cada raridade', async () => {
      const { result } = renderHook(() => useAllStickers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const totals = Object.fromEntries(
        result.current.sections.map((s) => [s.rarity, s.totalCount]),
      );
      expect(totals).toEqual({ lendaria: 2, rara: 1, comum: 2 });
    });

    it('conta quantas o usuário já possui em cada raridade', async () => {
      const { result } = renderHook(() => useAllStickers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const owned = Object.fromEntries(
        result.current.sections.map((s) => [s.rarity, s.ownedCount]),
      );
      expect(owned).toEqual({ lendaria: 1, rara: 0, comum: 1 });
    });

    it('expõe ownedIds como Set para consulta O(1)', async () => {
      const { result } = renderHook(() => useAllStickers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.ownedIds).toBeInstanceOf(Set);
      expect(result.current.ownedIds.has('s1')).toBe(true);
      expect(result.current.ownedIds.has('s2')).toBe(false);
    });

    it('separa cada figurinha na sua própria seção', async () => {
      const { result } = renderHook(() => useAllStickers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const lendarias = result.current.sections.find((s) => s.rarity === 'lendaria')!;
      expect(lendarias.stickers.map((s) => s.id)).toEqual(['s4', 's5']);
    });
  });

  it('devolve as três seções vazias quando não há figurinhas', async () => {
    const { result } = renderHook(() => useAllStickers());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.sections).toHaveLength(3);
    expect(result.current.sections.every((s) => s.totalCount === 0)).toBe(true);
    expect(result.current.sections.every((s) => s.ownedCount === 0)).toBe(true);
  });

  it('ignora ids possuídos que não existem no catálogo', async () => {
    getAllStickers.mockResolvedValue([makeSticker({ id: 's1', rarity: 'comum' })]);
    getUserCollection.mockResolvedValue(collection(['s1', 's-fantasma']));

    const { result } = renderHook(() => useAllStickers());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const comuns = result.current.sections.find((s) => s.rarity === 'comum')!;
    expect(comuns.ownedCount).toBe(1);
    expect(comuns.totalCount).toBe(1);
  });

  it('guarda o erro quando uma das buscas falha', async () => {
    getUserCollection.mockRejectedValue(new Error('coleção indisponível'));

    const { result } = renderHook(() => useAllStickers());

    await waitFor(() => expect(result.current.error).toBe('coleção indisponível'));
    expect(result.current.loading).toBe(false);
  });

  it('limpa o erro anterior no refetch bem-sucedido', async () => {
    getUserCollection.mockRejectedValueOnce(new Error('falha temporária'));
    const { result } = renderHook(() => useAllStickers());
    await waitFor(() => expect(result.current.error).toBe('falha temporária'));

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBeNull();
  });
});
