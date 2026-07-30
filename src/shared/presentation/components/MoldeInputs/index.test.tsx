import React from 'react';
import { TextInput } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { colors } from '../../theme/colors';
import { flattenStyle } from '../../../../../test/styleHelpers';
import { MoldeInputs } from './index';

/**
 * Lógica testável: o estado de erro muda a borda e adiciona a mensagem,
 * e os TextInputProps extras precisam continuar chegando ao TextInput.
 */
const input = () => screen.UNSAFE_getByType(TextInput).props;

describe('MoldeInputs', () => {
  it('renderiza o label acima do campo', () => {
    render(<MoldeInputs label="E-mail" />);

    expect(screen.getByText('E-mail')).toBeTruthy();
  });

  describe('estado de erro', () => {
    it('mostra a mensagem e pinta a borda de danger', () => {
      render(<MoldeInputs label="Senha" error="Senha muito curta" />);

      expect(screen.getByText('Senha muito curta')).toBeTruthy();
      expect(flattenStyle(input().style).borderColor).toBe(colors.danger);
    });

    it.each([
      ['null', null],
      ['undefined', undefined],
      ['string vazia', ''],
    ])('mantém a borda neutra e não mostra mensagem quando error é %s', (_caso, error) => {
      render(<MoldeInputs label="Senha" error={error} />);

      expect(flattenStyle(input().style).borderColor).toBe(colors.border);
    });
  });

  it('o style recebido por prop vence o estilo de erro', () => {
    render(<MoldeInputs label="Senha" error="inválida" style={{ borderColor: '#123456' }} />);

    expect(flattenStyle(input().style).borderColor).toBe('#123456');
  });

  it('repassa os TextInputProps extras para o TextInput', () => {
    const onChangeText = jest.fn();
    render(
      <MoldeInputs
        label="E-mail"
        placeholder="seu@email.com"
        keyboardType="email-address"
        secureTextEntry
        onChangeText={onChangeText}
      />,
    );

    expect(input().placeholder).toBe('seu@email.com');
    expect(input().keyboardType).toBe('email-address');
    expect(input().secureTextEntry).toBe(true);

    fireEvent.changeText(screen.UNSAFE_getByType(TextInput), 'a@a.com');
    expect(onChangeText).toHaveBeenCalledWith('a@a.com');
  });

  it('desliga autoCorrect por padrão, mas permite sobrescrever', () => {
    render(<MoldeInputs label="Nome" />);
    expect(input().autoCorrect).toBe(false);

    screen.unmount();

    render(<MoldeInputs label="Nome" autoCorrect />);
    expect(input().autoCorrect).toBe(true);
  });
});
