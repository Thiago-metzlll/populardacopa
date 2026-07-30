import React from 'react';
import { ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { DailyCoinsStatus } from '../../domain/constants/rewards';
import { colors } from '../../../../shared/presentation/theme';
import { flattenStyle } from '../../../../../test/styleHelpers';
import { useDailyCoinsReward } from '../hooks/useDailyCoinsReward';
import { CardRecompensaDiaria } from './CardRecompensaDiaria';

// jest.mock é elevado acima dos imports pelo babel-plugin-jest-hoist
jest.mock('../hooks/useDailyCoinsReward', () => ({
  useDailyCoinsReward: jest.fn(),
}));

const NOW = new Date('2026-07-29T12:00:00.000Z').getTime();

const claim = jest.fn();

const mockHook = (overrides: {
  status?: DailyCoinsStatus | null;
  loading?: boolean;
  claiming?: boolean;
  error?: string | null;
} = {}) => {
  (useDailyCoinsReward as jest.Mock).mockReturnValue({
    status: { available: true, nextAvailableAt: null, amount: 50 },
    loading: false,
    claiming: false,
    error: null,
    claim,
    ...overrides,
  });
};

/** ISO de um instante `ms` no futuro em relação ao "agora" congelado. */
const inFuture = (ms: number) => new Date(NOW + ms).toISOString();

const unavailable = (ms: number): DailyCoinsStatus => ({
  available: false,
  nextAvailableAt: inFuture(ms),
  amount: 50,
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers().setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('CardRecompensaDiaria', () => {
  it('não renderiza nada enquanto carrega', () => {
    mockHook({ loading: true, status: null });

    expect(render(<CardRecompensaDiaria />).toJSON()).toBeNull();
  });

  it('não renderiza nada quando não há status', () => {
    mockHook({ loading: false, status: null });

    expect(render(<CardRecompensaDiaria />).toJSON()).toBeNull();
  });

  describe('recompensa disponível', () => {
    it('mostra o valor em moedas vindo do status', () => {
      mockHook({ status: { available: true, nextAvailableAt: null, amount: 120 } });

      render(<CardRecompensaDiaria />);

      expect(screen.getByText('+120 moedas grátis!')).toBeTruthy();
      expect(screen.getByText('Resgatar')).toBeTruthy();
    });

    it('destaca o card em dourado', () => {
      mockHook();
      render(<CardRecompensaDiaria />);

      const gradient = screen.UNSAFE_getByType(LinearGradient).props;
      expect(gradient.colors).toEqual(['#2A2600', '#1E1E24']);
      expect(flattenStyle(gradient.style).borderColor).toBe('#FFD700');
      expect(screen.getByTestId('icon-gift').props.color).toBe('#FFD700');
    });

    it('chama claim ao tocar em Resgatar', () => {
      mockHook();
      render(<CardRecompensaDiaria />);

      fireEvent.press(screen.getByText('Resgatar'));

      expect(claim).toHaveBeenCalledTimes(1);
    });
  });

  describe('recompensa em cooldown', () => {
    it.each([
      ['menos de uma hora', 25 * 60 * 1000, 'Volte em 25min'],
      ['exatamente uma hora', 60 * 60 * 1000, 'Volte em 1h 0min'],
      ['horas e minutos', 7 * 60 * 60 * 1000 + 15 * 60 * 1000, 'Volte em 7h 15min'],
      ['arredonda segundos para cima', 30 * 1000, 'Volte em 1min'],
    ])('formata a contagem regressiva — %s', (_caso, ms, expectedText) => {
      mockHook({ status: unavailable(ms) });

      render(<CardRecompensaDiaria />);

      expect(screen.getByText(expectedText)).toBeTruthy();
    });

    it('mostra "Disponível agora" quando o prazo já passou', () => {
      mockHook({ status: unavailable(-1000) });

      render(<CardRecompensaDiaria />);

      expect(screen.getByText('Volte em Disponível agora')).toBeTruthy();
    });

    it('apaga o destaque e desabilita o resgate', () => {
      mockHook({ status: unavailable(60 * 60 * 1000) });
      render(<CardRecompensaDiaria />);

      const gradient = screen.UNSAFE_getByType(LinearGradient).props;
      expect(gradient.colors).toEqual(['#1E1E24', '#1E1E24']);
      expect(flattenStyle(gradient.style).borderColor).toBe('#333');
      expect(screen.getByTestId('icon-gift').props.color).toBe(colors.textSecondary);

      fireEvent.press(screen.getByText('Aguarde'));
      expect(claim).not.toHaveBeenCalled();
    });

    it('recalcula a contagem a cada 30s', () => {
      mockHook({ status: unavailable(31 * 60 * 1000) });
      render(<CardRecompensaDiaria />);

      expect(screen.getByText('Volte em 31min')).toBeTruthy();

      act(() => {
        jest.advanceTimersByTime(60_000);
      });

      expect(screen.getByText('Volte em 30min')).toBeTruthy();
    });

    it('para o intervalo ao desmontar', () => {
      const clearInterval = jest.spyOn(global, 'clearInterval');
      mockHook({ status: unavailable(60 * 60 * 1000) });

      render(<CardRecompensaDiaria />).unmount();

      expect(clearInterval).toHaveBeenCalled();
      clearInterval.mockRestore();
    });
  });

  it('troca o texto por um spinner enquanto resgata', () => {
    mockHook({ claiming: true });

    render(<CardRecompensaDiaria />);

    expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(screen.queryByText('Resgatar')).toBeNull();
  });

  it('exibe a mensagem de erro vinda do hook', () => {
    mockHook({ error: 'Falha ao resgatar moedas' });

    render(<CardRecompensaDiaria />);

    expect(screen.getByText('Falha ao resgatar moedas')).toBeTruthy();
  });
});
