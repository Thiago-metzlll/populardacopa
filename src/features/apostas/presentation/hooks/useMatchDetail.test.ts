import { act, renderHook, waitFor } from '@testing-library/react-native';
import { makeMatch } from '../../../../../test/fixtures';
import { makeGetUpcomingMatches } from '../../main/factories/makeGetUpcomingMatches';
import { useMatchDetail } from './useMatchDetail';

jest.mock('../../main/factories/makeGetUpcomingMatches', () => ({
  makeGetUpcomingMatches: jest.fn(),
}));

const execute = jest.fn();

const matches = [
  makeMatch({ id: 'm1', homeTeamId: 'bra' }),
  makeMatch({ id: 'm2', homeTeamId: 'arg' }),
];

beforeEach(() => {
  jest.clearAllMocks();
  (makeGetUpcomingMatches as jest.Mock).mockReturnValue({ execute });
  execute.mockResolvedValue(matches);
});

describe('useMatchDetail', () => {
  it('encontra a partida pelo id na lista de próximas', async () => {
    const { result } = renderHook(() => useMatchDetail('m2'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.match?.id).toBe('m2');
    expect(result.current.match?.homeTeamId).toBe('arg');
    expect(result.current.error).toBeNull();
  });

  it('reporta erro quando o id não existe na lista', async () => {
    const { result } = renderHook(() => useMatchDetail('m-inexistente'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.match).toBeNull();
    expect(result.current.error).toBe('Partida não encontrada');
  });

  it('reporta erro quando a lista vem vazia', async () => {
    execute.mockResolvedValue([]);

    const { result } = renderHook(() => useMatchDetail('m1'));

    await waitFor(() => expect(result.current.error).toBe('Partida não encontrada'));
    expect(result.current.match).toBeNull();
  });

  it('não busca nada quando o matchId é vazio', async () => {
    const { result } = renderHook(() => useMatchDetail(''));

    await waitFor(() => expect(execute).not.toHaveBeenCalled());
    expect(result.current.match).toBeNull();
  });

  it('rebusca quando o matchId muda', async () => {
    const { result, rerender } = renderHook(({ id }: { id: string }) => useMatchDetail(id), {
      initialProps: { id: 'm1' },
    });
    await waitFor(() => expect(result.current.match?.id).toBe('m1'));

    rerender({ id: 'm2' });

    await waitFor(() => expect(result.current.match?.id).toBe('m2'));
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('guarda o erro do repositório quando a busca falha', async () => {
    execute.mockRejectedValue(new Error('SQLite indisponível'));

    const { result } = renderHook(() => useMatchDetail('m1'));

    await waitFor(() => expect(result.current.error).toBe('SQLite indisponível'));
    expect(result.current.loading).toBe(false);
  });

  it('refetch reencontra a partida', async () => {
    const { result } = renderHook(() => useMatchDetail('m1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    execute.mockResolvedValue([makeMatch({ id: 'm1', homeScore: 2, awayScore: 1 })]);
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.match?.homeScore).toBe(2);
  });
});
