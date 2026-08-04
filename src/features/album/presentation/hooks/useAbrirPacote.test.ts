import { act, renderHook } from '@testing-library/react-native';
import { makeSticker, makeUser } from '../../../../../test/fixtures';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';
import { pendingPackStore, FREE_PACK_PREFIX } from '../../infra/stores/pendingPackStore';
import { makeOpenPackage } from '../../main/factories/makeOpenPackage';
import { useAbrirPacote } from './useAbrirPacote';

jest.mock('../../../../shared/presentation/contexts/UserContext', () => ({
  useCurrentUser: jest.fn(),
}));
jest.mock('../../main/factories/makeOpenPackage', () => ({ makeOpenPackage: jest.fn() }));

const execute = jest.fn();

const sorteadas = [
  makeSticker({ id: 's1', playerName: 'Um' }),
  makeSticker({ id: 's2', playerName: 'Dois' }),
  makeSticker({ id: 's3', playerName: 'Três' }),
];

beforeEach(() => {
  jest.clearAllMocks();
  pendingPackStore.clear('pack-1');
  (makeOpenPackage as jest.Mock).mockReturnValue({ execute });
  (useCurrentUser as jest.Mock).mockReturnValue(makeUser());
  execute.mockResolvedValue(sorteadas);
});

afterEach(() => {
  pendingPackStore.clear('pack-1');
});

describe('useAbrirPacote', () => {
  it('começa fechado, sem figurinhas e no índice 0', () => {
    const { result } = renderHook(() => useAbrirPacote('pack-1'));

    expect(result.current.stickers).toEqual([]);
    expect(result.current.isRevealing).toBe(false);
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  it('não carrega nada antes de startReveal', () => {
    renderHook(() => useAbrirPacote('pack-1'));

    expect(execute).not.toHaveBeenCalled();
  });

  describe('origem das figurinhas', () => {
    it('usa o pendingPackStore quando o pacote já foi sorteado na compra', async () => {
      pendingPackStore.set('pack-1', sorteadas);
      const { result } = renderHook(() => useAbrirPacote('pack-1'));

      await act(async () => {
        await result.current.startReveal();
      });

      expect(execute).not.toHaveBeenCalled();
      expect(result.current.stickers).toBe(sorteadas);
    });

    it('consome o store, deixando-o vazio para não reabrir o mesmo pacote', async () => {
      pendingPackStore.set('pack-1', sorteadas);
      const { result } = renderHook(() => useAbrirPacote('pack-1'));

      await act(async () => {
        await result.current.startReveal();
      });

      expect(pendingPackStore.has('pack-1')).toBe(false);
    });

    it('cai no use case openPackage quando o store está vazio', async () => {
      const { result } = renderHook(() => useAbrirPacote('pack-1'));

      await act(async () => {
        await result.current.startReveal();
      });

      expect(execute).toHaveBeenCalledWith('pack-1', 'u1');
      expect(result.current.stickers).toBe(sorteadas);
    });

    describe('pacote grátis', () => {
      const freePackId = `${FREE_PACK_PREFIX}123`;

      afterEach(() => pendingPackStore.clear(freePackId));

      it('revela as figurinhas já sorteadas pelo claim', async () => {
        pendingPackStore.set(freePackId, sorteadas);
        const { result } = renderHook(() => useAbrirPacote(freePackId));

        await act(async () => {
          await result.current.startReveal();
        });

        expect(execute).not.toHaveBeenCalled();
        expect(result.current.stickers).toBe(sorteadas);
      });

      it('não cai no openPackage quando o store perdeu o pacote — sortear de novo daria um pacote grátis extra', async () => {
        const { result } = renderHook(() => useAbrirPacote(freePackId));

        await act(async () => {
          await result.current.startReveal();
        });

        expect(execute).not.toHaveBeenCalled();
        expect(result.current.error).toBe('Este pacote grátis já foi aberto.');
        expect(result.current.stickers).toEqual([]);
      });
    });
  });

  it('marca isRevealing e reinicia o índice em startReveal', async () => {
    const { result } = renderHook(() => useAbrirPacote('pack-1'));

    await act(async () => {
      await result.current.startReveal();
    });

    expect(result.current.isRevealing).toBe(true);
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  it('não recarrega o pacote num segundo startReveal', async () => {
    const { result } = renderHook(() => useAbrirPacote('pack-1'));
    await act(async () => {
      await result.current.startReveal();
    });

    await act(async () => {
      await result.current.startReveal();
    });

    expect(execute).toHaveBeenCalledTimes(1);
  });

  describe('advanceCard', () => {
    it('avança um card por chamada', async () => {
      const { result } = renderHook(() => useAbrirPacote('pack-1'));
      await act(async () => {
        await result.current.startReveal();
      });

      act(() => result.current.advanceCard());
      expect(result.current.currentIndex).toBe(1);

      act(() => result.current.advanceCard());
      expect(result.current.currentIndex).toBe(2);
    });

    it('para no último card e não passa do fim', async () => {
      const { result } = renderHook(() => useAbrirPacote('pack-1'));
      await act(async () => {
        await result.current.startReveal();
      });

      act(() => result.current.advanceCard());
      act(() => result.current.advanceCard());
      act(() => result.current.advanceCard());
      act(() => result.current.advanceCard());

      expect(result.current.currentIndex).toBe(sorteadas.length - 1);
    });
  });

  it('não abre nada sem usuário autenticado', async () => {
    (useCurrentUser as jest.Mock).mockReturnValue(null);
    const { result } = renderHook(() => useAbrirPacote('pack-1'));

    await act(async () => {
      await result.current.startReveal();
    });

    expect(execute).not.toHaveBeenCalled();
    expect(result.current.stickers).toEqual([]);
  });

  it('guarda o erro quando o use case falha', async () => {
    execute.mockRejectedValue(new Error('Pacote inválido'));
    const { result } = renderHook(() => useAbrirPacote('pack-1'));

    await act(async () => {
      await result.current.startReveal();
    });

    expect(result.current.error).toBe('Pacote inválido');
    expect(result.current.loading).toBe(false);
    expect(result.current.stickers).toEqual([]);
  });
});
