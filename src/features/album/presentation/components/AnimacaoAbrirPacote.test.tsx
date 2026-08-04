import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { makeSticker } from '../../../../../test/fixtures';
import { Sticker } from '../../domain/entities/Sticker';
import { AnimacaoAbrirPacote } from './AnimacaoAbrirPacote';

// A carta só mostra a frente depois da "carga" de expectativa (um setTimeout
// por raridade); os testes adiantam esse tempo em vez de esperar de verdade.
const CHARGE_MAX_MS = 1200;

const baseProps = {
  stickers: [] as Sticker[],
  isRevealing: false,
  currentIndex: 0,
  loading: false,
  error: null as string | null,
  onStartReveal: jest.fn(),
  onAdvanceCard: jest.fn(),
  onDone: jest.fn(),
};

const renderComponent = (overrides: Partial<typeof baseProps> = {}) =>
  render(<AnimacaoAbrirPacote {...baseProps} {...overrides} />);

/** Passa a fase de carga da carta atual. */
const skipCharge = () =>
  act(() => {
    jest.advanceTimersByTime(CHARGE_MAX_MS);
  });

const trio: Sticker[] = [
  makeSticker({ id: 's1', playerName: 'Fulano', rarity: 'comum', isNew: true }),
  makeSticker({ id: 's2', playerName: 'Ciclano', rarity: 'rara', teamId: 'bra', isNew: false }),
  makeSticker({ id: 's3', playerName: 'Beltrano', rarity: 'lendaria', isNew: true }),
];

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('AnimacaoAbrirPacote', () => {
  it('mostra o spinner enquanto o pacote carrega', () => {
    renderComponent({ loading: true });

    expect(screen.getByText('Abrindo pacote...')).toBeTruthy();
  });

  it('mostra o erro vindo do hook', () => {
    renderComponent({ error: 'Este pacote grátis já foi aberto.' });

    expect(screen.getByText('Este pacote grátis já foi aberto.')).toBeTruthy();
  });

  describe('pacote fechado', () => {
    it('convida a abrir', () => {
      renderComponent({ stickers: trio });

      expect(screen.getByText('ABRIR PACOTE')).toBeTruthy();
    });

    it('avisa o pai só depois da animação de estouro', () => {
      const onStartReveal = jest.fn();
      renderComponent({ stickers: trio, onStartReveal });

      fireEvent.press(screen.getByText('ABRIR PACOTE'));
      expect(onStartReveal).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(600);
      });
      expect(onStartReveal).toHaveBeenCalledTimes(1);
    });
  });

  describe('carta revelada', () => {
    it('mostra o jogador, a raridade e o selo de nova', () => {
      renderComponent({ stickers: trio, isRevealing: true, currentIndex: 0 });
      skipCharge();

      expect(screen.getByText('Fulano')).toBeTruthy();
      expect(screen.getByText('Comum')).toBeTruthy();
      expect(screen.getByText('NOVA')).toBeTruthy();
    });

    it('marca como repetida a figurinha que o usuário já tinha', () => {
      renderComponent({ stickers: trio, isRevealing: true, currentIndex: 1 });
      skipCharge();

      expect(screen.getByText('Ciclano')).toBeTruthy();
      expect(screen.getByText('REPETIDA')).toBeTruthy();
      expect(screen.queryByText('NOVA')).toBeNull();
    });

    it('omite o selo quando o sorteio não informou nova/repetida', () => {
      const semSelo = [makeSticker({ playerName: 'Sem Selo' })];
      renderComponent({ stickers: semSelo, isRevealing: true, currentIndex: 0 });
      skipCharge();

      expect(screen.queryByText('NOVA')).toBeNull();
      expect(screen.queryByText('REPETIDA')).toBeNull();
    });

    it('mostra a posição no pacote', () => {
      renderComponent({ stickers: trio, isRevealing: true, currentIndex: 1 });

      expect(screen.getByText('2 / 3')).toBeTruthy();
    });

    it('avança para a próxima carta', () => {
      const onAdvanceCard = jest.fn();
      renderComponent({ stickers: trio, isRevealing: true, currentIndex: 0, onAdvanceCard });
      skipCharge();

      fireEvent.press(screen.getByText('PRÓXIMA'));

      expect(onAdvanceCard).toHaveBeenCalledTimes(1);
    });

    it('tocar na carta avança igual ao botão', () => {
      const onAdvanceCard = jest.fn();
      renderComponent({ stickers: trio, isRevealing: true, currentIndex: 0, onAdvanceCard });
      skipCharge();

      fireEvent.press(screen.getByLabelText('Avançar para a próxima figurinha'));

      expect(onAdvanceCard).toHaveBeenCalledTimes(1);
    });

    it('não avança enquanto a carta ainda está de costas', () => {
      const onAdvanceCard = jest.fn();
      renderComponent({ stickers: trio, isRevealing: true, currentIndex: 0, onAdvanceCard });

      fireEvent.press(screen.getByText('PRÓXIMA'));

      expect(onAdvanceCard).not.toHaveBeenCalled();
    });
  });

  describe('resumo do pacote', () => {
    const abrirResumo = (onDone = jest.fn()) => {
      renderComponent({ stickers: trio, isRevealing: true, currentIndex: 2, onDone });
      skipCharge();
      fireEvent.press(screen.getByText('VER RESUMO'));
      return onDone;
    };

    it('a última carta leva ao resumo em vez de encerrar direto', () => {
      const onDone = abrirResumo();

      expect(screen.getByText('Pacote aberto!')).toBeTruthy();
      expect(onDone).not.toHaveBeenCalled();
    });

    it('conta novas e repetidas', () => {
      abrirResumo();

      expect(screen.getByText('3 figurinhas · 2 novas · 1 repetida')).toBeTruthy();
    });

    it('lista todas as figurinhas do pacote', () => {
      abrirResumo();

      expect(screen.getByText('Fulano')).toBeTruthy();
      expect(screen.getByText('Ciclano')).toBeTruthy();
      expect(screen.getByText('Beltrano')).toBeTruthy();
    });

    it('encerra pelo CONCLUIR', () => {
      const onDone = abrirResumo();

      fireEvent.press(screen.getByText('CONCLUIR'));

      expect(onDone).toHaveBeenCalledTimes(1);
    });

    it('não inventa contagem quando o sorteio não informou nova/repetida', () => {
      const semSelo = [makeSticker({ id: 'x1', playerName: 'Sem Selo' })];
      renderComponent({ stickers: semSelo, isRevealing: true, currentIndex: 0 });
      skipCharge();
      fireEvent.press(screen.getByText('VER RESUMO'));

      expect(screen.getByText('1 figurinha')).toBeTruthy();
    });
  });
});
