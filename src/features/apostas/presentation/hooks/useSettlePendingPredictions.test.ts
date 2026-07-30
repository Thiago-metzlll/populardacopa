import { act, renderHook, waitFor } from '@testing-library/react-native';
import { makeUser } from '../../../../../test/fixtures';
import { useCurrentUser, useRefreshCoins } from '../../../../shared/presentation/contexts/UserContext';
import { Prediction } from '../../domain/entities/Prediction';
import { makeSettlePendingPredictions } from '../../main/factories/makeSettlePendingPredictions';
import { useSettlePendingPredictions } from './useSettlePendingPredictions';

jest.mock('../../../../shared/presentation/contexts/UserContext', () => ({
  useCurrentUser: jest.fn(),
  useRefreshCoins: jest.fn(),
}));
jest.mock('../../main/factories/makeSettlePendingPredictions', () => ({
  makeSettlePendingPredictions: jest.fn(),
}));

const execute = jest.fn();
const refreshCoins = jest.fn();

const settled: Prediction[] = [
  {
    id: 'p1',
    userId: 'u1',
    matchId: 'm1',
    predictedHomeScore: 2,
    predictedAwayScore: 1,
    reward: { type: 'coins', description: 'Acertou o placar' },
    status: 'won',
    createdAt: '2026-07-20T12:00:00.000Z',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  (makeSettlePendingPredictions as jest.Mock).mockReturnValue({ execute });
  (useCurrentUser as jest.Mock).mockReturnValue(makeUser());
  (useRefreshCoins as jest.Mock).mockReturnValue(refreshCoins);
  refreshCoins.mockResolvedValue(undefined);
  execute.mockResolvedValue([]);
});

describe('useSettlePendingPredictions', () => {
  it('não roda nada sem usuário autenticado', async () => {
    (useCurrentUser as jest.Mock).mockReturnValue(null);

    renderHook(() => useSettlePendingPredictions());

    await waitFor(() => expect(execute).not.toHaveBeenCalled());
  });

  it('resolve os palpites pendentes do usuário ao montar', async () => {
    const { result } = renderHook(() => useSettlePendingPredictions());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(execute).toHaveBeenCalledWith('u1');
  });

  it('mantém loading true durante o settlement', async () => {
    let resolveExecute: (value: Prediction[]) => void = () => {};
    execute.mockReturnValue(new Promise((resolve) => { resolveExecute = resolve; }));

    const { result } = renderHook(() => useSettlePendingPredictions());

    await waitFor(() => expect(result.current.loading).toBe(true));

    await act(async () => {
      resolveExecute([]);
    });

    expect(result.current.loading).toBe(false);
  });

  describe('quando há palpites resolvidos', () => {
    beforeEach(() => execute.mockResolvedValue(settled));

    it('atualiza o saldo de moedas', async () => {
      renderHook(() => useSettlePendingPredictions());

      await waitFor(() => expect(refreshCoins).toHaveBeenCalledTimes(1));
    });

    it('chama onSettled com os palpites resolvidos', async () => {
      const onSettled = jest.fn();
      renderHook(() => useSettlePendingPredictions(onSettled));

      await waitFor(() => expect(onSettled).toHaveBeenCalledWith(settled));
    });
  });

  describe('quando não há palpites para resolver', () => {
    it('não atualiza o saldo nem chama onSettled', async () => {
      const onSettled = jest.fn();
      const { result } = renderHook(() => useSettlePendingPredictions(onSettled));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(refreshCoins).not.toHaveBeenCalled();
      expect(onSettled).not.toHaveBeenCalled();
    });
  });

  it('usa sempre a versão mais recente de onSettled (via ref)', async () => {
    execute.mockResolvedValue(settled);
    const onSettledV1 = jest.fn();
    const { rerender } = renderHook(
      ({ cb }: { cb: (settled: Prediction[]) => void }) => useSettlePendingPredictions(cb),
      { initialProps: { cb: onSettledV1 } },
    );

    const onSettledV2 = jest.fn();
    rerender({ cb: onSettledV2 });

    await waitFor(() => expect(onSettledV2).toHaveBeenCalledWith(settled));
    expect(onSettledV1).not.toHaveBeenCalled();
  });

  it('não atualiza o estado após desmontar antes do settlement resolver', async () => {
    let resolveExecute: (value: Prediction[]) => void = () => {};
    execute.mockReturnValue(new Promise((resolve) => { resolveExecute = resolve; }));
    const onSettled = jest.fn();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = renderHook(() => useSettlePendingPredictions(onSettled));
    unmount();

    await act(async () => {
      resolveExecute(settled);
    });

    expect(onSettled).not.toHaveBeenCalled();
    expect(refreshCoins).not.toHaveBeenCalled();
    // nenhum "state update on unmounted component" deveria ter sido emitido
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('roda novamente quando o usuário muda de identidade', async () => {
    const { rerender } = renderHook(() => useSettlePendingPredictions());
    await waitFor(() => expect(execute).toHaveBeenCalledWith('u1'));

    (useCurrentUser as jest.Mock).mockReturnValue(makeUser({ id: 'u2' }));
    rerender(undefined);

    await waitFor(() => expect(execute).toHaveBeenCalledWith('u2'));
  });
});
