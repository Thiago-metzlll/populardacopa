import React from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { DailyClaimStatus } from '../../domain/constants/rewards';
import { Sticker } from '../../domain/entities/Sticker';
import { colors } from '../../../../shared/presentation/theme';
import { flattenStyle } from '../../../../../test/styleHelpers';
import { useFreePackage } from '../hooks/useFreePackage';
import { CardPacoteGratis } from './CardPacoteGratis';

// jest.mock é elevado acima dos imports pelo babel-plugin-jest-hoist
jest.mock('../hooks/useFreePackage', () => ({
  useFreePackage: jest.fn(),
}));

const NOW = new Date('2026-07-29T12:00:00.000Z').getTime();

const claim = jest.fn();

const mockHook = (overrides: {
  status?: DailyClaimStatus | null;
  loading?: boolean;
  claiming?: boolean;
  error?: string | null;
} = {}) => {
  (useFreePackage as jest.Mock).mockReturnValue({
    status: { available: true, nextAvailableAt: null },
    loading: false,
    claiming: false,
    error: null,
    claim,
    ...overrides,
  });
};

/** ISO de um instante `ms` no futuro em relação ao "agora" congelado. */
const inFuture = (ms: number) => new Date(NOW + ms).toISOString();

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers().setSystemTime(NOW);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
});

describe('CardPacoteGratis', () => {
  it('não renderiza nada enquanto carrega', () => {
    mockHook({ loading: true, status: null });

    expect(render(<CardPacoteGratis />).toJSON()).toBeNull();
  });

  it('não renderiza nada quando não há status', () => {
    mockHook({ loading: false, status: null });

    expect(render(<CardPacoteGratis />).toJSON()).toBeNull();
  });

  describe('pacote disponível', () => {
    beforeEach(() => mockHook({ status: { available: true, nextAvailableAt: null } }));

    it('convida a abrir o pacote e destaca o card', () => {
      render(<CardPacoteGratis />);

      expect(screen.getByText('3 figurinhas te esperando!')).toBeTruthy();
      expect(screen.getByText('Abrir')).toBeTruthy();

      const gradient = screen.UNSAFE_getByType(LinearGradient).props;
      expect(gradient.colors).toEqual(['#0A2A1E', '#1E1E24']);
      expect(flattenStyle(gradient.style).borderColor).toBe(colors.primary);
    });

    it('usa a cor primária no ícone', () => {
      render(<CardPacoteGratis />);

      expect(screen.getByTestId('icon-cube').props.color).toBe(colors.primary);
    });
  });

  describe('pacote em cooldown', () => {
    it.each([
      ['menos de uma hora', 25 * 60 * 1000, 'Volte em 25min'],
      ['exatamente uma hora', 60 * 60 * 1000, 'Volte em 1h 0min'],
      ['horas e minutos', 3 * 60 * 60 * 1000 + 30 * 60 * 1000, 'Volte em 3h 30min'],
      ['cooldown cheio de 24h', 24 * 60 * 60 * 1000, 'Volte em 24h 0min'],
      ['arredonda segundos para cima', 90 * 1000, 'Volte em 2min'],
    ])('formata a contagem regressiva — %s', (_caso, ms, expectedText) => {
      mockHook({ status: { available: false, nextAvailableAt: inFuture(ms) } });

      render(<CardPacoteGratis />);

      expect(screen.getByText(expectedText)).toBeTruthy();
    });

    it('mostra "Disponível agora" quando o prazo já passou', () => {
      mockHook({ status: { available: false, nextAvailableAt: inFuture(-1000) } });

      render(<CardPacoteGratis />);

      expect(screen.getByText('Volte em Disponível agora')).toBeTruthy();
    });

    it('desabilita o botão e apaga o destaque do card', () => {
      mockHook({ status: { available: false, nextAvailableAt: inFuture(60 * 60 * 1000) } });
      render(<CardPacoteGratis />);

      const button = screen.getByText('Aguarde').parent!;
      const gradient = screen.UNSAFE_getByType(LinearGradient).props;

      expect(gradient.colors).toEqual(['#1E1E24', '#1E1E24']);
      expect(flattenStyle(gradient.style).borderColor).toBe('#333');
      expect(screen.getByTestId('icon-cube').props.color).toBe(colors.textSecondary);
      expect(button).toBeTruthy();
    });

    it('não chama claim ao tocar no botão desabilitado', () => {
      mockHook({ status: { available: false, nextAvailableAt: inFuture(60 * 60 * 1000) } });
      render(<CardPacoteGratis />);

      fireEvent.press(screen.getByText('Aguarde'));

      expect(claim).not.toHaveBeenCalled();
    });

    it('recalcula a contagem a cada 30s sem novo fetch', () => {
      mockHook({ status: { available: false, nextAvailableAt: inFuture(31 * 60 * 1000) } });
      render(<CardPacoteGratis />);

      expect(screen.getByText('Volte em 31min')).toBeTruthy();

      // 30min30s ainda arredonda para 31min (Math.ceil); só após 1min cai para 30min
      act(() => {
        jest.advanceTimersByTime(60_000);
      });

      expect(screen.getByText('Volte em 30min')).toBeTruthy();
    });
  });

  describe('resgate', () => {
    const stickers: Sticker[] = [
      { id: 's1', albumId: 'a1', playerName: 'Fulano', price: 10, rarity: 'comum', imageUrl: '', obtainedAt: '' },
      { id: 's2', albumId: 'a1', playerName: 'Ciclano', price: 50, rarity: 'lendaria', imageUrl: '', obtainedAt: '' },
    ];

    it('avisa o pai e lista as figurinhas obtidas no Alert', async () => {
      claim.mockResolvedValue(stickers);
      const onClaimed = jest.fn();
      mockHook();
      render(<CardPacoteGratis onClaimed={onClaimed} />);

      await act(async () => {
        fireEvent.press(screen.getByText('Abrir'));
      });

      expect(claim).toHaveBeenCalledTimes(1);
      expect(onClaimed).toHaveBeenCalledTimes(1);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Pacote grátis aberto!',
        '• Fulano (comum)\n• Ciclano (lendaria)',
      );
    });

    it('não quebra quando onClaimed não é informado', async () => {
      claim.mockResolvedValue(stickers);
      mockHook();
      render(<CardPacoteGratis />);

      await act(async () => {
        fireEvent.press(screen.getByText('Abrir'));
      });

      expect(Alert.alert).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['undefined', undefined],
      ['lista vazia', []],
    ])('não avisa o pai nem abre Alert quando o claim retorna %s', async (_caso, returned) => {
      claim.mockResolvedValue(returned);
      const onClaimed = jest.fn();
      mockHook();
      render(<CardPacoteGratis onClaimed={onClaimed} />);

      await act(async () => {
        fireEvent.press(screen.getByText('Abrir'));
      });

      expect(onClaimed).not.toHaveBeenCalled();
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('troca o texto por um spinner enquanto resgata', () => {
      mockHook({ claiming: true });
      render(<CardPacoteGratis />);

      expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
      expect(screen.queryByText('Abrir')).toBeNull();
    });
  });

  it('exibe a mensagem de erro vinda do hook', () => {
    mockHook({ error: 'Falha ao resgatar pacote' });

    render(<CardPacoteGratis />);

    expect(screen.getByText('Falha ao resgatar pacote')).toBeTruthy();
  });

  it('não renderiza área de erro quando não há erro', () => {
    mockHook({ error: null });

    render(<CardPacoteGratis />);

    expect(screen.queryByText('Falha ao resgatar pacote')).toBeNull();
  });
});
