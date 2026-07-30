import { act, renderHook, waitFor } from '@testing-library/react-native';
import { makePlayer } from '../../../../../test/fixtures';
import { makeGetPlayerById } from '../../main/factories/makeGetPlayerById';
import { usePlayerDetail } from './usePlayerDetail';

jest.mock('../../main/factories/makeGetPlayerById', () => ({
  makeGetPlayerById: jest.fn(),
}));

const execute = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (makeGetPlayerById as jest.Mock).mockReturnValue({ execute });
  execute.mockResolvedValue(makePlayer());
});

describe('usePlayerDetail', () => {
  it('busca o jogador pelo id', async () => {
    const { result } = renderHook(() => usePlayerDetail('p1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(execute).toHaveBeenCalledWith('p1');
    expect(result.current.player?.id).toBe('p1');
    expect(result.current.error).toBeNull();
  });

  it('não busca nada quando o playerId é vazio', async () => {
    const { result } = renderHook(() => usePlayerDetail(''));

    await waitFor(() => expect(execute).not.toHaveBeenCalled());
    expect(result.current.player).toBeNull();
  });

  it('rebusca quando o playerId muda', async () => {
    const { rerender } = renderHook(({ id }: { id: string }) => usePlayerDetail(id), {
      initialProps: { id: 'p1' },
    });
    await waitFor(() => expect(execute).toHaveBeenCalledWith('p1'));

    rerender({ id: 'p2' });

    await waitFor(() => expect(execute).toHaveBeenCalledWith('p2'));
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('guarda o erro quando a busca falha', async () => {
    execute.mockRejectedValue(new Error('Jogador não encontrado'));

    const { result } = renderHook(() => usePlayerDetail('p1'));

    await waitFor(() => expect(result.current.error).toBe('Jogador não encontrado'));
    expect(result.current.loading).toBe(false);
    expect(result.current.player).toBeNull();
  });

  it('refetch busca o jogador novamente', async () => {
    const { result } = renderHook(() => usePlayerDetail('p1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    execute.mockResolvedValue(makePlayer({ number: 99 }));
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.player?.number).toBe(99);
  });
});
