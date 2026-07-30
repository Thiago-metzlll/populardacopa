import { act, renderHook, waitFor } from '@testing-library/react-native';
import { makeUser } from '../../../../../test/fixtures';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';
import { makeGetPredictionHistory } from '../../main/factories/makeGetPredictionHistory';
import { usePredictionHistory } from './usePredictionHistory';

jest.mock('../../../../shared/presentation/contexts/UserContext', () => ({
  useCurrentUser: jest.fn(),
}));
jest.mock('../../main/factories/makeGetPredictionHistory', () => ({
  makeGetPredictionHistory: jest.fn(),
}));

const execute = jest.fn();

const history = {
  predictions: [],
  totalPoints: 120,
  successRate: 0.6,
};

beforeEach(() => {
  jest.clearAllMocks();
  (makeGetPredictionHistory as jest.Mock).mockReturnValue({ execute });
  (useCurrentUser as jest.Mock).mockReturnValue(makeUser());
  execute.mockResolvedValue(history);
});

describe('usePredictionHistory', () => {
  it('busca o histórico do usuário atual ao montar', async () => {
    const { result } = renderHook(() => usePredictionHistory());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(execute).toHaveBeenCalledWith('u1');
    expect(result.current.history).toEqual(history);
    expect(result.current.error).toBeNull();
  });

  it('não busca nada sem usuário autenticado', async () => {
    (useCurrentUser as jest.Mock).mockReturnValue(null);

    renderHook(() => usePredictionHistory());

    await waitFor(() => expect(execute).not.toHaveBeenCalled());
  });

  it('começa com history null e loading true', async () => {
    const { result } = renderHook(() => usePredictionHistory());

    expect(result.current.history).toBeNull();
    expect(result.current.loading).toBe(true);

    // deixa a busca inicial concluir para não vazar setState fora de act()
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('guarda o erro quando a busca falha', async () => {
    execute.mockRejectedValue(new Error('Firestore indisponível'));

    const { result } = renderHook(() => usePredictionHistory());

    await waitFor(() => expect(result.current.error).toBe('Firestore indisponível'));
    expect(result.current.loading).toBe(false);
    expect(result.current.history).toBeNull();
  });

  it('rebusca quando o usuário muda de identidade', async () => {
    const { rerender } = renderHook(() => usePredictionHistory());
    await waitFor(() => expect(execute).toHaveBeenCalledWith('u1'));

    (useCurrentUser as jest.Mock).mockReturnValue(makeUser({ id: 'u2' }));
    rerender(undefined);

    await waitFor(() => expect(execute).toHaveBeenCalledWith('u2'));
  });

  it('refetch busca o histórico novamente', async () => {
    const { result } = renderHook(() => usePredictionHistory());
    await waitFor(() => expect(result.current.loading).toBe(false));

    execute.mockResolvedValue({ ...history, totalPoints: 999 });
    await act(async () => {
      await result.current.refetch();
    });

    expect(execute).toHaveBeenCalledTimes(2);
    expect(result.current.history?.totalPoints).toBe(999);
  });
});
