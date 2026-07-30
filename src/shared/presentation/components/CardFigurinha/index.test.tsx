import React from 'react';
import { TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Sticker } from '../../../../features/album/domain/entities/Sticker';
import { flattenStyle } from '../../../../../test/styleHelpers';
import { CardFigurinha } from './index';

const makeSticker = (overrides: Partial<Sticker> = {}): Sticker => ({
  id: 's42',
  albumId: 'a1',
  playerName: 'Fulano da Silva',
  price: 100,
  rarity: 'comum',
  imageUrl: 'https://img/foto.png',
  obtainedAt: '2026-03-15T12:00:00.000Z',
  ...overrides,
});

const gradientProps = () => screen.UNSAFE_getByType(LinearGradient).props;

describe('CardFigurinha', () => {
  describe('estilo por raridade', () => {
    it.each([
      ['comum', ['#3A3A40', '#24242B'], '#555', '○'],
      ['rara', ['#1a1a4e', '#24242B'], '#4488FF', '●'],
      ['lendaria', ['#3d2000', '#24242B'], '#FFD700', '★'],
    ] as const)('%s usa gradiente, borda e símbolo próprios', (rarity, colors, border, symbol) => {
      render(<CardFigurinha sticker={makeSticker({ rarity })} />);

      expect(gradientProps().colors).toEqual(colors);
      expect(flattenStyle(gradientProps().style).borderColor).toBe(border);
      expect(screen.getByText(symbol)).toBeTruthy();
    });

    it('usa texto escuro no badge apenas na lendária', () => {
      render(<CardFigurinha sticker={makeSticker({ rarity: 'lendaria' })} />);
      expect(flattenStyle(screen.getByText('★').props.style).color).toBe('#1A1A1E');

      screen.unmount();

      render(<CardFigurinha sticker={makeSticker({ rarity: 'rara' })} />);
      expect(flattenStyle(screen.getByText('●').props.style).color).toBe('#FFF');
    });

    it('aplica a borda de seleção quando selected é true', () => {
      render(<CardFigurinha sticker={makeSticker({ rarity: 'rara' })} selected />);

      const style = flattenStyle(gradientProps().style);
      expect(style.borderColor).toBe('#B4FF00');
      expect(style.borderWidth).toBe(3);
    });

    it('mantém a borda da raridade quando selected é false', () => {
      render(<CardFigurinha sticker={makeSticker({ rarity: 'rara' })} selected={false} />);

      const style = flattenStyle(gradientProps().style);
      expect(style.borderColor).toBe('#4488FF');
      expect(style.borderWidth).toBe(2);
    });
  });

  describe('id exibido', () => {
    it('remove o prefixo "s" do id da figurinha', () => {
      render(<CardFigurinha sticker={makeSticker({ id: 's42' })} />);

      expect(screen.getByText('#42')).toBeTruthy();
    });

    it('remove apenas a primeira ocorrência de "s"', () => {
      render(<CardFigurinha sticker={makeSticker({ id: 's1s2' })} />);

      expect(screen.getByText('#1s2')).toBeTruthy();
    });
  });

  describe('variação de tamanho', () => {
    it('o tamanho full (padrão) mostra nome, data e usa as dimensões maiores', () => {
      render(<CardFigurinha sticker={makeSticker()} />);

      expect(flattenStyle(gradientProps().style).width).toBe(120);
      expect(screen.getByText('Fulano da Silva')).toBeTruthy();
      expect(screen.getByText('15/03/2026')).toBeTruthy();
    });

    it('o tamanho compact esconde a data e usa as dimensões menores', () => {
      render(<CardFigurinha sticker={makeSticker()} size="compact" />);

      expect(flattenStyle(gradientProps().style).width).toBe(80);
      expect(screen.getByText('Fulano da Silva')).toBeTruthy();
      expect(screen.queryByText('15/03/2026')).toBeNull();
    });
  });

  describe('data de obtenção', () => {
    it('formata a data ISO no padrão pt-BR', () => {
      // meio-dia UTC: evita virar o dia em qualquer fuso da máquina de CI
      render(<CardFigurinha sticker={makeSticker({ obtainedAt: '2026-12-30T12:00:00.000Z' })} />);

      expect(screen.getByText('30/12/2026')).toBeTruthy();
    });

    it('mostra N/A quando não há data de obtenção', () => {
      render(<CardFigurinha sticker={makeSticker({ obtainedAt: '' })} />);

      expect(screen.getByText('N/A')).toBeTruthy();
    });
  });

  describe('interação', () => {
    it('envolve o card em TouchableOpacity e dispara onPress', () => {
      const onPress = jest.fn();
      render(<CardFigurinha sticker={makeSticker()} onPress={onPress} />);

      fireEvent.press(screen.UNSAFE_getByType(TouchableOpacity));

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('não renderiza TouchableOpacity quando onPress não é informado', () => {
      render(<CardFigurinha sticker={makeSticker()} />);

      expect(screen.UNSAFE_queryAllByType(TouchableOpacity)).toHaveLength(0);
    });
  });
});
