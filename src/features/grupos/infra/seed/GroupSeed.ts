import { Group } from '../../domain/entities/Group';

export const mockGroups: Group[] = [
  {
    id: 'g1',
    name: 'Grupo A',
    teamIds: ['t1', 't2', 't3', 't4'],
    standings: [
      { teamId: 't1', points: 9, matchesPlayed: 3, wins: 3, draws: 0, losses: 0, goalsFor: 7, goalsAgainst: 1, goalDifference: 6 },
      { teamId: 't2', points: 6, matchesPlayed: 3, wins: 2, draws: 0, losses: 1, goalsFor: 4, goalsAgainst: 3, goalDifference: 1 },
      { teamId: 't3', points: 3, matchesPlayed: 3, wins: 1, draws: 0, losses: 2, goalsFor: 2, goalsAgainst: 5, goalDifference: -3 },
      { teamId: 't4', points: 0, matchesPlayed: 3, wins: 0, draws: 0, losses: 3, goalsFor: 0, goalsAgainst: 4, goalDifference: -4 },
    ],
  },
  {
    id: 'g2',
    name: 'Grupo B',
    teamIds: ['t5', 't6', 't7', 't8'],
    standings: [
      { teamId: 't5', points: 7, matchesPlayed: 3, wins: 2, draws: 1, losses: 0, goalsFor: 5, goalsAgainst: 2, goalDifference: 3 },
      { teamId: 't6', points: 5, matchesPlayed: 3, wins: 1, draws: 2, losses: 0, goalsFor: 3, goalsAgainst: 2, goalDifference: 1 },
      { teamId: 't7', points: 4, matchesPlayed: 3, wins: 1, draws: 1, losses: 1, goalsFor: 4, goalsAgainst: 4, goalDifference: 0 },
      { teamId: 't8', points: 0, matchesPlayed: 3, wins: 0, draws: 0, losses: 3, goalsFor: 1, goalsAgainst: 5, goalDifference: -4 },
    ],
  },
];
