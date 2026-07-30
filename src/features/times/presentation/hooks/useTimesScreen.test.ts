import { act, renderHook, waitFor } from '@testing-library/react-native';
import { makeTeam, makeUser } from '../../../../../test/fixtures';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';
import { makeGetAllTeams } from '../../main/factories/makeGetAllTeams';
import { makeGetFavoriteTeams } from '../../main/factories/makeGetFavoriteTeams';
import { makeSearchTeams } from '../../main/factories/makeSearchTeams';
import { makeToggleFavoriteTeam } from '../../main/factories/makeToggleFavoriteTeam';
import { useTimesScreen } from './useTimesScreen';

jest.mock('../../../../shared/presentation/contexts/UserContext', () => ({
  useCurrentUser: jest.fn(),
}));
jest.mock('../../main/factories/makeGetAllTeams', () => ({ makeGetAllTeams: jest.fn() }));
jest.mock('../../main/factories/makeGetFavoriteTeams', () => ({ makeGetFavoriteTeams: jest.fn() }));
jest.mock('../../main/factories/makeSearchTeams', () => ({ makeSearchTeams: jest.fn() }));
jest.mock('../../main/factories/makeToggleFavoriteTeam', () => ({ makeToggleFavoriteTeam: jest.fn() }));

const getAllTeams = jest.fn();
const getFavoriteTeams = jest.fn();
const searchTeams = jest.fn();
const toggleFavoriteTeam = jest.fn();

const allTeams = [
  makeTeam({ id: 'bra', isFavorite: true }),
  makeTeam({ id: 'arg', name: 'Argentina', isFavorite: false }),
];
const favoriteTeams = [allTeams[0]];

beforeEach(() => {
  jest.clearAllMocks();
  (makeGetAllTeams as jest.Mock).mockReturnValue({ execute: getAllTeams });
  (makeGetFavoriteTeams as jest.Mock).mockReturnValue({ execute: getFavoriteTeams });
  (makeSearchTeams as jest.Mock).mockReturnValue({ execute: searchTeams });
  (makeToggleFavoriteTeam as jest.Mock).mockReturnValue({ execute: toggleFavoriteTeam });
  (useCurrentUser as jest.Mock).mockReturnValue(makeUser());
  getAllTeams.mockResolvedValue(allTeams);
  getFavoriteTeams.mockResolvedValue(favoriteTeams);
  toggleFavoriteTeam.mockResolvedValue(undefined);
});

describe('useTimesScreen', () => {
  it('busca a lista completa e os favoritos ao montar', async () => {
    const { result } = renderHook(() => useTimesScreen());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getAllTeams).toHaveBeenCalledTimes(1);
    expect(getFavoriteTeams).toHaveBeenCalledWith('u1');
    expect(result.current.allTeams).toEqual(allTeams);
    expect(result.current.favoriteTeams).toEqual(favoriteTeams);
  });

  it('esvazia os favoritos sem buscar quando não há usuário autenticado', async () => {
    (useCurrentUser as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useTimesScreen());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.favoriteTeams).toEqual([]);
    expect(getFavoriteTeams).not.toHaveBeenCalled();
    // a lista completa de times independe de autenticação
    expect(getAllTeams).toHaveBeenCalledTimes(1);
  });

  describe('search', () => {
    it('busca com a query e filtra os resultados favoritos localmente', async () => {
      searchTeams.mockResolvedValue([
        { ...allTeams[0], isFavorite: true },
        { ...allTeams[1], isFavorite: false },
      ]);
      const { result } = renderHook(() => useTimesScreen());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.search('bra');
      });

      expect(searchTeams).toHaveBeenCalledWith('u1', 'bra');
      expect(result.current.allTeams).toHaveLength(2);
      expect(result.current.favoriteTeams).toEqual([
        { ...allTeams[0], isFavorite: true },
      ]);
    });

    it('passa userId undefined para a busca sem usuário autenticado', async () => {
      (useCurrentUser as jest.Mock).mockReturnValue(null);
      searchTeams.mockResolvedValue([]);
      const { result } = renderHook(() => useTimesScreen());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.search('bra');
      });

      expect(searchTeams).toHaveBeenCalledWith(undefined, 'bra');
    });

    it('não atualiza favoriteTeams sem usuário autenticado', async () => {
      (useCurrentUser as jest.Mock).mockReturnValue(null);
      searchTeams.mockResolvedValue([{ ...allTeams[0], isFavorite: true }]);
      const { result } = renderHook(() => useTimesScreen());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.search('bra');
      });

      expect(result.current.favoriteTeams).toEqual([]);
    });

    it('restaura as duas listas completas quando a busca é limpa', async () => {
      const { result } = renderHook(() => useTimesScreen());
      await waitFor(() => expect(result.current.loading).toBe(false));
      getAllTeams.mockClear();
      getFavoriteTeams.mockClear();

      await act(async () => {
        await result.current.search('   ');
      });

      expect(searchTeams).not.toHaveBeenCalled();
      expect(getAllTeams).toHaveBeenCalledTimes(1);
      expect(getFavoriteTeams).toHaveBeenCalledTimes(1);
    });

    it('restaura apenas a lista completa (sem favoritos) quando não há usuário', async () => {
      (useCurrentUser as jest.Mock).mockReturnValue(null);
      const { result } = renderHook(() => useTimesScreen());
      await waitFor(() => expect(result.current.loading).toBe(false));
      getAllTeams.mockClear();

      await act(async () => {
        await result.current.search('');
      });

      expect(getAllTeams).toHaveBeenCalledTimes(1);
      expect(getFavoriteTeams).not.toHaveBeenCalled();
    });

    it('guarda o erro quando a busca falha', async () => {
      searchTeams.mockRejectedValue(new Error('busca indisponível'));
      const { result } = renderHook(() => useTimesScreen());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.search('bra');
      });

      expect(result.current.error).toBe('busca indisponível');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('toggleFavorite', () => {
    it('alterna o favorito e rebusca as duas listas', async () => {
      const { result } = renderHook(() => useTimesScreen());
      await waitFor(() => expect(result.current.loading).toBe(false));
      getAllTeams.mockClear();
      getFavoriteTeams.mockClear();

      await act(async () => {
        await result.current.toggleFavorite('arg');
      });

      expect(toggleFavoriteTeam).toHaveBeenCalledWith('u1', 'arg');
      expect(getAllTeams).toHaveBeenCalledTimes(1);
      expect(getFavoriteTeams).toHaveBeenCalledTimes(1);
    });

    it('não faz nada sem usuário autenticado', async () => {
      (useCurrentUser as jest.Mock).mockReturnValue(null);
      const { result } = renderHook(() => useTimesScreen());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.toggleFavorite('arg');
      });

      expect(toggleFavoriteTeam).not.toHaveBeenCalled();
    });

    it('guarda o erro quando o toggle falha', async () => {
      toggleFavoriteTeam.mockRejectedValue(new Error('falha ao favoritar'));
      const { result } = renderHook(() => useTimesScreen());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.toggleFavorite('arg');
      });

      expect(result.current.error).toBe('falha ao favoritar');
    });
  });

  it('guarda o erro quando a busca inicial da lista completa falha', async () => {
    getAllTeams.mockRejectedValue(new Error('SQLite indisponível'));

    const { result } = renderHook(() => useTimesScreen());

    await waitFor(() => expect(result.current.error).toBe('SQLite indisponível'));
    expect(result.current.loading).toBe(false);
  });
});
