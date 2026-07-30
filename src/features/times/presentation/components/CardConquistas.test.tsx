import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { CardConquistas } from './CardConquistas';

describe('CardConquistas', () => {
  it('exibe a contagem de títulos mundiais', () => {
    render(<CardConquistas worldCupWins={5} titles={[]} />);

    expect(screen.getByText('Títulos Mundiais')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('renderiza um chip para cada ano de título', () => {
    render(<CardConquistas worldCupWins={3} titles={['1958', '1962', '1970']} />);

    expect(screen.getByText('1958')).toBeTruthy();
    expect(screen.getByText('1962')).toBeTruthy();
    expect(screen.getByText('1970')).toBeTruthy();
  });

  it('omite a área de chips quando não há títulos', () => {
    const tree = render(<CardConquistas worldCupWins={0} titles={[]} />).toJSON();

    expect(screen.getByText('0')).toBeTruthy();
    // header (1 View) dentro do container: nenhuma lista de anos renderizada
    expect((tree as any).children).toHaveLength(1);
  });

  it('renderiza chips repetidos sem colisão de chave', () => {
    render(<CardConquistas worldCupWins={2} titles={['1994', '1994']} />);

    expect(screen.getAllByText('1994')).toHaveLength(2);
  });
});
