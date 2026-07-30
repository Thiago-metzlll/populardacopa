import { act, renderHook, waitFor } from '@testing-library/react-native';
import { makePlayer, makeTeam } from '../../../../../test/fixtures';
import { makeGetTeamById } from '../../main/factories/makeGetTeamById';
import { useTeamDetail } from './useTeamDetail';

jest.mock('../../main/factories/makeGetTeamById', () => ({
  makeGetTeamById: jest.fn(),
}));

const execute = jest.fn();

const players = [makePlayer({ id: 'p1' }), makePlayer({ id: 'p2' })];

beforeEach(() => {
  jest.clearAllMocks();
  (makeGetTeamById as jest.Mock).mockReturnValue({ execute });
  execute.mockResolvedValue({ team: makeTeam(), players });
});

describe('useTeamDetail', () => {
  it('busca o time e seus jogadores pelo id', async () => {
    const { result } = renderHook(() => useTeamDetail('bra'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(execute).toHaveBeenCalledWith('bra');
    expect(result.current.team?.id).toBe('bra');
    expect(result.current.players).toEqual(players);
    expect(result.current.error).toBeNull();
  });

  it('não busca nada quando o teamId é vazio', async () => {
    const { result } = renderHook(() => useTeamDetail(''));

    await waitFor(() => expect(execute).not.toHaveBeenCalled());
    expect(result.current.team).toBeNull();
    expect(result.current.players).toEqual([]);
  });

  it('rebusca quando o teamId muda', async () => {
    const { rerender } = renderHook(({ id }: { id: string }) => useTeamDetail(id), {
      initialProps: { id: 'bra' },
    });
    await waitFor(() => expect(execute).toHaveBeenCalledWith('bra'));

    execute.mockResolvedValue({ team: makeTeam({ id: 'arg', name: 'Argentina' }), players: [] });
    rerender({ id: 'arg' });

    await waitFor(() => expect(execute).toHaveBeenCalledWith('arg'));
  });

  it('guarda o erro quando a busca falha', async () => {
    execute.mockRejectedValue(new Error('Time não encontrado'));

    const { result } = renderHook(() => useTeamDetail('bra'));

    await waitFor(() => expect(result.current.error).toBe('Time não encontrado'));
    expect(result.current.loading).toBe(false);
    expect(result.current.team).toBeNull();
    expect(result.current.players).toEqual([]);
  });

  it('refetch busca o time novamente', async () => {
    const { result } = renderHook(() => useTeamDetail('bra'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    execute.mockResolvedValue({ team: makeTeam({ isFavorite: true }), players });
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.team?.isFavorite).toBe(true);
  });
});
