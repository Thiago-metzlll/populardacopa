import { act, renderHook } from '@testing-library/react-native';
import { makeUser } from '../../../../../test/fixtures';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';
import { Prediction } from '../../domain/entities/Prediction';
import { makeCreatePrediction } from '../../main/factories/makeCreatePrediction';
import { useCreatePrediction } from './useCreatePrediction';

jest.mock('../../../../shared/presentation/contexts/UserContext', () => ({
  useCurrentUser: jest.fn(),
}));
jest.mock('../../main/factories/makeCreatePrediction', () => ({
  makeCreatePrediction: jest.fn(),
}));

const execute = jest.fn();

const created: Prediction = {
  id: 'p1',
  userId: 'u1',
  matchId: 'm1',
  predictedHomeScore: 2,
  predictedAwayScore: 1,
  reward: { type: 'coins', description: 'Recompensa base' },
  status: 'pending',
  createdAt: '2026-07-29T12:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  (makeCreatePrediction as jest.Mock).mockReturnValue({ execute });
  (useCurrentUser as jest.Mock).mockReturnValue(makeUser());
  execute.mockResolvedValue(created);
});

describe('useCreatePrediction', () => {
  it('cria o palpite com os dados do usuário atual e a recompensa base', async () => {
    const { result } = renderHook(() => useCreatePrediction());

    let returned;
    await act(async () => {
      returned = await result.current.createPrediction('m1', 2, 1);
    });

    expect(execute).toHaveBeenCalledWith({
      userId: 'u1',
      matchId: 'm1',
      predictedHomeScore: 2,
      predictedAwayScore: 1,
      reward: { type: 'coins', description: 'Recompensa base' },
    });
    expect(returned).toBe(created);
    expect(result.current.loading).toBe(false);
  });

  it('chama onSuccess quando o palpite é criado', async () => {
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useCreatePrediction(onSuccess));

    await act(async () => {
      await result.current.createPrediction('m1', 2, 1);
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('não chama onSuccess quando não há usuário autenticado', async () => {
    (useCurrentUser as jest.Mock).mockReturnValue(null);
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useCreatePrediction(onSuccess));

    let returned;
    await act(async () => {
      returned = await result.current.createPrediction('m1', 2, 1);
    });

    expect(returned).toBeUndefined();
    expect(execute).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('guarda o erro e não chama onSuccess quando a criação falha', async () => {
    execute.mockRejectedValue(new Error('Palpite já enviado para esta partida'));
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useCreatePrediction(onSuccess));

    let returned;
    await act(async () => {
      returned = await result.current.createPrediction('m1', 2, 1);
    });

    expect(returned).toBeUndefined();
    expect(result.current.error).toBe('Palpite já enviado para esta partida');
    expect(result.current.loading).toBe(false);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  /**
   * Comportamento atual documentado: diferente de useLogin/useRegister, este
   * hook nunca chama setError(null), então um erro anterior permanece visível
   * mesmo depois de uma tentativa bem-sucedida.
   */
  it('mantém o erro anterior visível mesmo após uma tentativa bem-sucedida', async () => {
    execute.mockRejectedValueOnce(new Error('falha temporária'));
    const { result } = renderHook(() => useCreatePrediction());
    await act(async () => {
      await result.current.createPrediction('m1', 2, 1);
    });
    expect(result.current.error).toBe('falha temporária');

    execute.mockResolvedValueOnce(created);
    await act(async () => {
      await result.current.createPrediction('m1', 2, 1);
    });

    expect(result.current.error).toBe('falha temporária');
  });
});
