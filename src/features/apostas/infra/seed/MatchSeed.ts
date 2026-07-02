import { Match } from '../../domain/entities/Match';

export const mockMatches: Match[] = [
  {
    id: 'm1',
    homeTeamId: 't1', // Brasil
    awayTeamId: 't2', // Argentina
    date: new Date(Date.now() + 86400000 * 2).toISOString(),
    phase: 'Fase de Grupos',
    status: 'scheduled',
    odds: { homeWin: 2.1, draw: 3.2, awayWin: 3.5 }
  },
  {
    id: 'm2',
    homeTeamId: 't1', // Brasil
    awayTeamId: 't10', // EUA (fictício para mock)
    date: new Date(Date.now() + 86400000 * 5).toISOString(),
    phase: 'Fase de Grupos',
    status: 'scheduled',
    odds: { homeWin: 1.5, draw: 4.0, awayWin: 6.5 }
  },
  {
    id: 'm3',
    homeTeamId: 't3', // França
    awayTeamId: 't4', // Alemanha
    date: new Date(Date.now() + 86400000 * 3).toISOString(),
    phase: 'Fase de Grupos',
    status: 'scheduled',
    odds: { homeWin: 2.5, draw: 3.1, awayWin: 2.8 }
  },
  {
    id: 'm4',
    homeTeamId: 't5', // Espanha
    awayTeamId: 't8', // Itália
    date: new Date(Date.now() + 86400000 * 4).toISOString(),
    phase: 'Fase de Grupos',
    status: 'scheduled',
    odds: { homeWin: 2.2, draw: 3.0, awayWin: 3.2 }
  }
];
