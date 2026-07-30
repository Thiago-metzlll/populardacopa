import React from 'react';
import { ActivityIndicator, TouchableOpacity } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { flattenStyle } from '../../../../../test/styleHelpers';
import { PalpiteBtn } from './index';

const button = () => screen.UNSAFE_getByType(TouchableOpacity).props;

describe('PalpiteBtn', () => {
  it('usa o label padrão quando nenhum é informado', () => {
    render(<PalpiteBtn onConfirm={jest.fn()} />);

    expect(screen.getByText('Confirmar Palpite')).toBeTruthy();
  });

  it('usa o label customizado quando informado', () => {
    render(<PalpiteBtn onConfirm={jest.fn()} label="Salvar aposta" />);

    expect(screen.getByText('Salvar aposta')).toBeTruthy();
    expect(screen.queryByText('Confirmar Palpite')).toBeNull();
  });

  it('chama onConfirm ao tocar no estado normal', () => {
    const onConfirm = jest.fn();
    render(<PalpiteBtn onConfirm={onConfirm} />);

    fireEvent.press(screen.getByText('Confirmar Palpite'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(button().disabled).toBe(false);
    expect(flattenStyle(button().style).opacity).toBeUndefined();
  });

  it.each([
    ['disabled', { disabled: true }],
    ['isLoading', { isLoading: true }],
    ['ambos', { disabled: true, isLoading: true }],
  ])('marca disabled e reduz a opacidade quando %s', (_caso, props) => {
    render(<PalpiteBtn onConfirm={jest.fn()} {...props} />);

    expect(button().disabled).toBe(true);
    expect(flattenStyle(button().style).opacity).toBe(0.5);
  });

  it('não dispara onConfirm ao tocar num botão desabilitado', () => {
    const onConfirm = jest.fn();
    render(<PalpiteBtn onConfirm={onConfirm} disabled />);

    fireEvent.press(screen.getByText('Confirmar Palpite'));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('substitui o label por spinner enquanto carrega', () => {
    render(<PalpiteBtn onConfirm={jest.fn()} label="Salvar aposta" isLoading />);

    expect(screen.queryByText('Salvar aposta')).toBeNull();
    expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('mantém o label visível quando apenas disabled', () => {
    render(<PalpiteBtn onConfirm={jest.fn()} disabled />);

    expect(screen.getByText('Confirmar Palpite')).toBeTruthy();
    expect(screen.UNSAFE_queryAllByType(ActivityIndicator)).toHaveLength(0);
  });
});
