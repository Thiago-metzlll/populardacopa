import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { hasStyle } from '../../../../../test/styleHelpers';
import { CardColecao } from './index';

/**
 * Lógica testável: cálculo da barra de progresso — percentual derivado de
 * progress/total e limitado (clamp) entre 0% e 100%.
 */
describe('CardColecao', () => {
  it('usa os valores padrão de total e título quando não informados', () => {
    render(<CardColecao progress={0} />);

    expect(screen.getByText('Minhas Figurinhas')).toBeTruthy();
    expect(screen.getByText('0/100')).toBeTruthy();
  });

  it('exibe título e contador customizados', () => {
    render(<CardColecao progress={12} total={48} title="Álbum Copa 2026" />);

    expect(screen.getByText('Álbum Copa 2026')).toBeTruthy();
    expect(screen.getByText('12/48')).toBeTruthy();
  });

  it('arredonda o progresso para inteiro no contador', () => {
    render(<CardColecao progress={7.8} total={20} />);

    expect(screen.getByText('8/20')).toBeTruthy();
  });

  it.each([
    ['metade da coleção', 25, 50, '50%'],
    ['coleção vazia', 0, 50, '0%'],
    ['coleção completa', 50, 50, '100%'],
    ['progresso acima do total é limitado a 100%', 80, 50, '100%'],
    ['progresso negativo é limitado a 0%', -10, 50, '0%'],
  ])('largura da barra — %s', (_caso, progress, total, expectedWidth) => {
    const tree = render(<CardColecao progress={progress} total={total} />).toJSON();

    expect(hasStyle(tree as any, 'width', expectedWidth)).toBe(true);
  });
});
