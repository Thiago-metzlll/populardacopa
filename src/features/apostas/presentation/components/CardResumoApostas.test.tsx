import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { colors } from '../../../../shared/presentation/theme';
import { flattenStyle } from '../../../../../test/styleHelpers';
import { CardResumoApostas } from './CardResumoApostas';

/**
 * Lógica testável: o percentual de vitórias muda de cor no limite de 50%
 * (>= 50 usa primary, abaixo usa secondary).
 */
describe('CardResumoApostas', () => {
  it('exibe o total de palpites e o percentual recebidos', () => {
    render(<CardResumoApostas totalPalpites={17} winPercentage={64} />);

    expect(screen.getByText('17')).toBeTruthy();
    expect(screen.getByText('64%')).toBeTruthy();
  });

  it('renderiza os ícones de alvo e troféu', () => {
    render(<CardResumoApostas totalPalpites={0} winPercentage={0} />);

    expect(screen.getByTestId('icon-locate')).toBeTruthy();
    expect(screen.getByTestId('icon-trophy')).toBeTruthy();
  });

  it.each([
    ['acima do limite', 80, colors.primary],
    ['exatamente no limite de 50%', 50, colors.primary],
    ['logo abaixo do limite', 49, colors.secondary],
    ['sem vitórias', 0, colors.secondary],
    ['todas as vitórias', 100, colors.primary],
  ])('cor do percentual — %s', (_caso, winPercentage, expectedColor) => {
    render(<CardResumoApostas totalPalpites={10} winPercentage={winPercentage} />);

    const value = screen.getByText(`${winPercentage}%`);
    expect(flattenStyle(value.props.style).color).toBe(expectedColor);
  });

  it('não colore o total de palpites pelo percentual', () => {
    render(<CardResumoApostas totalPalpites={10} winPercentage={0} />);

    expect(flattenStyle(screen.getByText('10').props.style).color).toBe(colors.textPrimary);
  });
});
