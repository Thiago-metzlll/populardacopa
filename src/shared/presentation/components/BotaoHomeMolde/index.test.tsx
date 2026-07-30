import React from 'react';
import { ActivityIndicator, TouchableOpacity } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { colors } from '../../theme';
import { flattenStyle } from '../../../../../test/styleHelpers';
import { BotaoHomeMolde } from './index';

const button = () => screen.UNSAFE_getByType(TouchableOpacity).props;
const buttonStyle = () => flattenStyle(button().style);

describe('BotaoHomeMolde', () => {
  describe('variantes', () => {
    it('primary (padrão) preenche o fundo e usa texto escuro', () => {
      render(<BotaoHomeMolde label="Entrar" onPress={jest.fn()} />);

      expect(buttonStyle().backgroundColor).toBe(colors.primary);
      expect(flattenStyle(screen.getByText('Entrar').props.style).color).toBe('#1A1A1E');
    });

    it('outline usa fundo transparente e texto na cor primária', () => {
      render(<BotaoHomeMolde label="Cancelar" onPress={jest.fn()} variant="outline" />);

      expect(buttonStyle().backgroundColor).toBe('transparent');
      expect(buttonStyle().borderColor).toBe(colors.primary);
      expect(flattenStyle(screen.getByText('Cancelar').props.style).color).toBe(colors.primary);
    });
  });

  describe('largura', () => {
    it('não ocupa a largura toda por padrão', () => {
      render(<BotaoHomeMolde label="Entrar" onPress={jest.fn()} />);

      expect(buttonStyle().width).toBeUndefined();
    });

    it('ocupa 100% quando fullWidth é true', () => {
      render(<BotaoHomeMolde label="Entrar" onPress={jest.fn()} fullWidth />);

      expect(buttonStyle().width).toBe('100%');
    });
  });

  describe('estados bloqueados', () => {
    it.each([
      ['disabled', { disabled: true }],
      ['loading', { loading: true }],
      ['ambos', { disabled: true, loading: true }],
    ])('reduz a opacidade e marca disabled quando %s', (_caso, props) => {
      render(<BotaoHomeMolde label="Entrar" onPress={jest.fn()} {...props} />);

      expect(button().disabled).toBe(true);
      expect(buttonStyle().opacity).toBe(0.5);
    });

    it('não dispara onPress ao tocar num botão desabilitado', () => {
      const onPress = jest.fn();
      render(<BotaoHomeMolde label="Entrar" onPress={onPress} disabled />);

      fireEvent.press(screen.getByText('Entrar'));

      expect(onPress).not.toHaveBeenCalled();
    });

    it('permanece habilitado e opaco no estado normal', () => {
      const onPress = jest.fn();
      render(<BotaoHomeMolde label="Entrar" onPress={onPress} />);

      expect(button().disabled).toBe(false);
      expect(buttonStyle().opacity).toBeUndefined();

      fireEvent.press(screen.getByText('Entrar'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('loading', () => {
    it('substitui o label por spinner escuro na variante primary', () => {
      render(<BotaoHomeMolde label="Entrar" onPress={jest.fn()} loading />);

      expect(screen.queryByText('Entrar')).toBeNull();
      expect(screen.UNSAFE_getByType(ActivityIndicator).props.color).toBe('#1A1A1E');
    });

    it('usa spinner na cor primária na variante outline', () => {
      render(<BotaoHomeMolde label="Entrar" onPress={jest.fn()} variant="outline" loading />);

      expect(screen.UNSAFE_getByType(ActivityIndicator).props.color).toBe(colors.primary);
    });

    it('mostra o label quando não está carregando', () => {
      render(<BotaoHomeMolde label="Entrar" onPress={jest.fn()} />);

      expect(screen.getByText('Entrar')).toBeTruthy();
      expect(screen.UNSAFE_queryAllByType(ActivityIndicator)).toHaveLength(0);
    });
  });
});
