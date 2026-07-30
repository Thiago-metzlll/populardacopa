import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Match } from '../../domain/entities/Match';
import { ContainerAposta } from './ContainerAposta';

const makeMatch = (overrides: Partial<Match> = {}): Match => ({
  id: 'm1',
  homeTeamId: 'bra',
  awayTeamId: 'arg',
  date: '2026-06-11T21:00:00.000Z',
  phase: 'grupos',
  status: 'scheduled',
  ...overrides,
});

describe('ContainerAposta', () => {
  it('exibe a fase da partida em maiúsculas', () => {
    render(<ContainerAposta match={makeMatch({ phase: 'oitavas de final' })} />);

    expect(screen.getByText('OITAVAS DE FINAL')).toBeTruthy();
  });

  it('abrevia os times para as 3 primeiras letras em maiúsculas', () => {
    render(<ContainerAposta match={makeMatch({ homeTeamId: 'brasil', awayTeamId: 'ar' })} />);

    expect(screen.getByText('BRA')).toBeTruthy();
    // ids menores que 3 caracteres são exibidos por completo
    expect(screen.getByText('AR')).toBeTruthy();
  });

  it('mostra placar oculto e status de próximo jogo', () => {
    render(<ContainerAposta match={makeMatch()} />);

    expect(screen.getByText('? - ?')).toBeTruthy();
    expect(screen.getByText('Próximo Jogo')).toBeTruthy();
  });

  it('chama onPress ao tocar em "Dar Palpite"', () => {
    const onPress = jest.fn();
    render(<ContainerAposta match={makeMatch()} onPress={onPress} />);

    fireEvent.press(screen.getByText('Dar Palpite'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('cai no log de fallback quando onPress não é informado', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    render(<ContainerAposta match={makeMatch({ id: 'm99' })} />);

    fireEvent.press(screen.getByText('Dar Palpite'));

    expect(log).toHaveBeenCalledWith('Dar Palpite clicado para a partida:', 'm99');
    log.mockRestore();
  });
});
