import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { rarityColors } from '../../../../shared/presentation/theme';
import { flattenStyle } from '../../../../../test/styleHelpers';
import { Sticker } from '../../domain/entities/Sticker';
import { StickerCard } from './StickerCard';

const makeSticker = (overrides: Partial<Sticker> = {}): Sticker => ({
  id: 's1',
  albumId: 'a1',
  playerName: 'Fulano da Silva',
  price: 250,
  rarity: 'comum',
  imageUrl: 'https://img/foto.png',
  obtainedAt: '',
  ...overrides,
});

describe('StickerCard', () => {
  describe('estado owned', () => {
    it('esconde cadeado e preço quando a figurinha já é do usuário', () => {
      render(<StickerCard sticker={makeSticker()} owned />);

      expect(screen.queryByTestId('icon-lock-closed')).toBeNull();
      expect(screen.queryByText('250 moedas')).toBeNull();
      expect(screen.getByText('Fulano da Silva')).toBeTruthy();
    });

    it('mostra cadeado e preço quando a figurinha não é do usuário', () => {
      render(<StickerCard sticker={makeSticker({ price: 999 })} owned={false} />);

      expect(screen.getByTestId('icon-lock-closed')).toBeTruthy();
      expect(screen.getByTestId('icon-pricetag-outline')).toBeTruthy();
      expect(screen.getByText('999 moedas')).toBeTruthy();
    });
  });

  describe('estilo por raridade', () => {
    it.each(['comum', 'rara', 'lendaria'] as const)(
      '%s usa a borda e o rótulo do tema',
      (rarity) => {
        render(<StickerCard sticker={makeSticker({ rarity })} owned />);

        const card = screen.UNSAFE_getByType(TouchableOpacity).props;
        expect(flattenStyle(card.style).borderColor).toBe(rarityColors[rarity].border);
        expect(screen.getByText(rarityColors[rarity].label)).toBeTruthy();
      },
    );

    it('aplica as cores do badge definidas no tema', () => {
      render(<StickerCard sticker={makeSticker({ rarity: 'lendaria' })} owned />);

      const badgeText = screen.getByText('Lendária');
      expect(flattenStyle(badgeText.props.style).color).toBe(rarityColors.lendaria.badgeText);
    });
  });

  describe('interação', () => {
    it('dispara onPress quando informado', () => {
      const onPress = jest.fn();
      render(<StickerCard sticker={makeSticker()} owned onPress={onPress} />);

      fireEvent.press(screen.UNSAFE_getByType(TouchableOpacity));

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('fica desabilitado quando onPress não é informado', () => {
      render(<StickerCard sticker={makeSticker()} owned />);

      expect(screen.UNSAFE_getByType(TouchableOpacity).props.disabled).toBe(true);
    });

    it('fica habilitado quando onPress é informado', () => {
      render(<StickerCard sticker={makeSticker()} owned onPress={jest.fn()} />);

      expect(screen.UNSAFE_getByType(TouchableOpacity).props.disabled).toBe(false);
    });
  });

  it('mescla o style recebido por prop no card', () => {
    render(<StickerCard sticker={makeSticker()} owned style={{ marginTop: 42 }} />);

    const card = screen.UNSAFE_getByType(TouchableOpacity).props;
    expect(flattenStyle(card.style).marginTop).toBe(42);
  });

  it('usa a imageUrl da figurinha como fonte da imagem', () => {
    render(<StickerCard sticker={makeSticker({ imageUrl: 'https://img/outra.png' })} owned />);

    expect(screen.UNSAFE_getByType(Image).props.source).toEqual({ uri: 'https://img/outra.png' });
  });
});
