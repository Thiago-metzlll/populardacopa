import { act, renderHook, waitFor } from '@testing-library/react-native';
import { makeTeam, makeUser } from '../../../../../test/fixtures';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';
import { makeGetFavoriteTeams } from '../../main/factories/makeGetFavoriteTeams';
import { makeSearchTeams } from '../../main/factories/makeSearchTeams';
import { makeToggleFavoriteTeam } from '../../main/factories/makeToggleFavoriteTeam';
import { useFavoriteTeams } from './useFavoriteTeams';

jest.mock('../../../../shared/presentation/contexts/UserContext', () => ({
  useCurrentUser: jest.fn(),
}));
jest.mock('../../main/factories/makeGetFavoriteTeams', () => ({ makeGetFavoriteTeams: jest.fn() }));
jest.mock('../../main/factories/makeSearchTeams', () => ({ makeSearchTeams: jest.fn() }));
jest.mock('../../main/factories/makeToggleFavoriteTeam', () => ({ makeToggleFavoriteTeam: jest.fn() }));

const getFavoriteTeams = jest.fn();
const searchTeams = jest.fn();
const toggleFavoriteTeam = jest.fn();

const favoritos = [makeTeam({ id: 'bra' }), makeTeam({ id: 'arg', name: 'Argentina' })];

beforeEach(() => {
  jest.clearAllMocks();
  (makeGetFavoriteTeams as jest.Mock).mockReturnValue({ execute: getFavoriteTeams });
  (makeSearchTeams as jest.Mock).mockReturnValue({ execute: searchTeams });
  (makeToggleFavoriteTeam as jest.Mock).mockReturnValue({ execute: toggleFavoriteTeam });
  (useCurrentUser as jest.Mock).mockReturnValue(makeUser());
  getFavoriteTeams.mockResolvedValue(favoritos);
  searchTeams.mockResolvedValue([favoritos[0]]);
  toggleFavoriteTeam.mockResolvedValue(undefined);
});

describe('useFavoriteTeams', () => {
  it('busca os times favoritos do usuário ao montar', async () => {
    const { result } = renderHook(() => useFavoriteTeams());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getFavoriteTeams).toHaveBeenCalledWith('u1');
    expect(result.current.teams).toEqual(favoritos);
  });

  it('esvazia a lista e encerra o loading sem usuário autenticado', async () => {
    (useCurrentUser as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useFavoriteTeams());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.teams).toEqual([]);
    expect(getFavoriteTeams).not.toHaveBeenCalled();
  });

  it('guarda o erro quando a busca inicial falha', async () => {
    getFavoriteTeams.mockRejectedValue(new Error('SQLite indisponível'));

    const { result } = renderHook(() => useFavoriteTeams());

    await waitFor(() => expect(result.current.error).toBe('SQLite indisponível'));
    expect(result.current.loading).toBe(false);
  });

  describe('search', () => {
    it('busca times pelo texto e substitui a lista', async () => {
      const { result } = renderHook(() => useFavoriteTeams());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.search('bra');
      });

      expect(searchTeams).toHaveBeenCalledWith('u1', 'bra');
      expect(result.current.teams).toEqual([favoritos[0]]);
    });

    it('não busca nada sem usuário autenticado', async () => {
      (useCurrentUser as jest.Mock).mockReturnValue(null);
      const { result } = renderHook(() => useFavoriteTeams());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.search('bra');
      });

      expect(searchTeams).not.toHaveBeenCalled();
    });

    it('guarda o erro quando a busca falha', async () => {
      searchTeams.mockRejectedValue(new Error('busca indisponível'));
      const { result } = renderHook(() => useFavoriteTeams());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.search('bra');
      });

      expect(result.current.error).toBe('busca indisponível');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('toggleFavorite', () => {
    it('alterna o favorito e rebusca a lista de favoritos', async () => {
      const { result } = renderHook(() => useFavoriteTeams());
      await waitFor(() => expect(result.current.loading).toBe(false));
      getFavoriteTeams.mockResolvedValue([favoritos[1]]);

      await act(async () => {
        await result.current.toggleFavorite('bra');
      });

      expect(toggleFavoriteTeam).toHaveBeenCalledWith('u1', 'bra');
      expect(getFavoriteTeams).toHaveBeenCalledTimes(2);
      expect(result.current.teams).toEqual([favoritos[1]]);
    });

    it('não faz nada sem usuário autenticado', async () => {
      (useCurrentUser as jest.Mock).mockReturnValue(null);
      const { result } = renderHook(() => useFavoriteTeams());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.toggleFavorite('bra');
      });

      expect(toggleFavoriteTeam).not.toHaveBeenCalled();
    });

    it('guarda o erro e não rebusca quando o toggle falha', async () => {
      toggleFavoriteTeam.mockRejectedValue(new Error('falha ao favoritar'));
      const { result } = renderHook(() => useFavoriteTeams());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.toggleFavorite('bra');
      });

      expect(result.current.error).toBe('falha ao favoritar');
      expect(getFavoriteTeams).toHaveBeenCalledTimes(1);
    });
  });
});
