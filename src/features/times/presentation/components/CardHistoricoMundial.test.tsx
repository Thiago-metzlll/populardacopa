import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PlayerEditionRecord } from '../../domain/entities/Player';
import { colors } from '../../../../shared/presentation/theme';
import { collectStyles, flattenStyle } from '../../../../../test/styleHelpers';
import { CardHistoricoMundial } from './CardHistoricoMundial';

const record = (overrides: Partial<PlayerEditionRecord> = {}): PlayerEditionRecord => ({
  edition: 'Copa 2022',
  team: 'Argentina',
  result: 'Campeão',
  ...overrides,
});

/** Quantas linhas têm a borda inferior de separação. */
const countRowBorders = (tree: unknown) =>
  collectStyles(tree as any).filter((style) => style.borderBottomWidth === 1).length;

describe('CardHistoricoMundial', () => {
  describe('estado vazio', () => {
    it.each([
      ['lista vazia', []],
      ['undefined', undefined as unknown as PlayerEditionRecord[]],
      ['null', null as unknown as PlayerEditionRecord[]],
    ])('mostra a mensagem de ausência quando o histórico é %s', (_caso, history) => {
      render(<CardHistoricoMundial history={history} />);

      expect(screen.getByText('Nenhuma participação em Copas registrada.')).toBeTruthy();
      expect(screen.getByText('WORLD CUP HISTORY')).toBeTruthy();
    });
  });

  describe('lista de participações', () => {
    it('renderiza edição, seleção e resultado de cada registro', () => {
      render(
        <CardHistoricoMundial
          history={[
            record({ edition: 'Copa 2018', team: 'Argentina', result: 'Oitavas-de-final' }),
            record({ edition: 'Copa 2022', team: 'Argentina', result: 'Campeão' }),
          ]}
        />,
      );

      expect(screen.getByText('Copa 2018')).toBeTruthy();
      expect(screen.getByText('Copa 2022')).toBeTruthy();
      expect(screen.getByText('Oitavas-de-final')).toBeTruthy();
      expect(screen.getByText('Campeão')).toBeTruthy();
      expect(screen.getAllByText('Argentina')).toHaveLength(2);
      expect(screen.queryByText('Nenhuma participação em Copas registrada.')).toBeNull();
    });

    it('separa as linhas com borda, exceto a última', () => {
      const tree = render(
        <CardHistoricoMundial
          history={[
            record({ edition: 'Copa 2014' }),
            record({ edition: 'Copa 2018' }),
            record({ edition: 'Copa 2022' }),
          ]}
        />,
      ).toJSON();

      expect(countRowBorders(tree)).toBe(2);
    });

    it('não desenha borda quando há apenas uma participação', () => {
      const tree = render(<CardHistoricoMundial history={[record()]} />).toJSON();

      expect(countRowBorders(tree)).toBe(0);
    });

    it('não quebra com edições repetidas (chave composta com o índice)', () => {
      render(
        <CardHistoricoMundial
          history={[record({ edition: 'Copa 2022' }), record({ edition: 'Copa 2022' })]}
        />,
      );

      expect(screen.getAllByText('Copa 2022')).toHaveLength(2);
    });
  });

  describe('cor do resultado', () => {
    it.each([
      ['Campeão', '#FFD700'],
      ['campeão invicto', '#FFD700'],
      ['VICE', '#C0C0C0'],
      ['Vice (2ª colocação)', '#C0C0C0'],
      ['Semifinal', colors.secondary],
      ['Semi-finalista', colors.secondary],
      ['Quartas-de-final', colors.textSecondary],
      ['Fase de grupos', colors.textSecondary],
    ])('%s usa a cor correspondente', (result, expectedColor) => {
      render(<CardHistoricoMundial history={[record({ result })]} />);

      const resultText = screen.getByText(result);
      expect(flattenStyle(resultText.props.style).color).toBe(expectedColor);
    });

    /**
     * Comportamento atual documentado: "campeão" é testado antes de "vice",
     * então "Vice-campeão" acaba pintado de ouro em vez de prata.
     * Se a regra mudar, este teste deve mudar junto.
     */
    it('pinta "Vice-campeão" de ouro porque "campeão" é checado primeiro', () => {
      render(<CardHistoricoMundial history={[record({ result: 'Vice-campeão' })]} />);

      expect(flattenStyle(screen.getByText('Vice-campeão').props.style).color).toBe('#FFD700');
    });
  });
});
