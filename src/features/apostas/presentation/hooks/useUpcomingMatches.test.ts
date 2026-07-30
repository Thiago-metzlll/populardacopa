import { renderHook, waitFor } from '@testing-library/react-native';
import { makeMatch } from '../../../../../test/fixtures';
import { makeGetUpcomingMatches } from '../../main/factories/makeGetUpcomingMatches';
import { useUpcomingMatches } from './useUpcomingMatches';

jest.mock('../../main/factories/makeGetUpcomingMatches', () => ({
  makeGetUpcomingMatches: jest.fn(),
}));

const execute = jest.fn();

const matches = [makeMatch({ id: 'm1' }), makeMatch({ id: 'm2' })];

beforeEach(() => {
  jest.clearAllMocks();
  (makeGetUpcomingMatches as jest.Mock).mockReturnValue({ execute });
  execute.mockResolvedValue(matches);
});

describe('useUpcomingMatches', () => {
  it('busca as próximas partidas ao montar, sem depender de usuário', async () => {
    const { result } = renderHook(() => useUpcomingMatches());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(execute).toHaveBeenCalledTimes(1);
    expect(result.current.matches).toEqual(matches);
    expect(result.current.error).toBeNull();
  });

  it('começa com lista vazia em loading', async () => {
    const { result } = renderHook(() => useUpcomingMatches());

    expect(result.current.matches).toEqual([]);
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('lida com lista vazia de partidas', async () => {
    execute.mockResolvedValue([]);

    const { result } = renderHook(() => useUpcomingMatches());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.matches).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('guarda o erro quando a busca falha', async () => {
    execute.mockRejectedValue(new Error('SQLite indisponível'));

    const { result } = renderHook(() => useUpcomingMatches());

    await waitFor(() => expect(result.current.error).toBe('SQLite indisponível'));
    expect(result.current.loading).toBe(false);
    expect(result.current.matches).toEqual([]);
  });

  it('busca apenas uma vez em re-renders sem mudança de dependência', async () => {
    const { result, rerender } = renderHook(() => useUpcomingMatches());
    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender(undefined);
    rerender(undefined);

    expect(execute).toHaveBeenCalledTimes(1);
  });
});
