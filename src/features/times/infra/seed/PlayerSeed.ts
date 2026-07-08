import { Player } from '../../domain/entities/Player';

export const mockPlayers: Player[] = [
  // Brasil (t1)
  {
    id: 'p1', name: 'Alisson', number: 1, position: 'Goleiro', teamId: 't1',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alisson',
    awards: ['MELHOR GOLEIRO'],
    worldCupHistory: [
      { edition: 'Copa 2018', team: 'Brasil', result: 'Quartas-de-final' },
      { edition: 'Copa 2022', team: 'Brasil', result: 'Quartas-de-final' },
    ],
    stats: { goals: 0, assists: 0, matchesPlayed: 50, worldCupsPlayed: 2 },
  },
  {
    id: 'p2', name: 'Marquinhos', number: 4, position: 'Defensor', teamId: 't1',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marquinhos',
    awards: [],
    worldCupHistory: [
      { edition: 'Copa 2018', team: 'Brasil', result: 'Quartas-de-final' },
      { edition: 'Copa 2022', team: 'Brasil', result: 'Quartas-de-final' },
    ],
    stats: { goals: 5, assists: 2, matchesPlayed: 70, worldCupsPlayed: 2 },
  },
  {
    id: 'p3', name: 'Casemiro', number: 5, position: 'Meio-campista', teamId: 't1',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=casemiro',
    awards: ['MVP'],
    worldCupHistory: [
      { edition: 'Copa 2018', team: 'Brasil', result: 'Quartas-de-final' },
      { edition: 'Copa 2022', team: 'Brasil', result: 'Quartas-de-final' },
    ],
    stats: { goals: 7, assists: 5, matchesPlayed: 65, worldCupsPlayed: 2 },
  },
  {
    id: 'p4', name: 'Vinícius Jr.', number: 7, position: 'Atacante', teamId: 't1',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vinicius',
    awards: ['ARTILHEIRO', 'MVP'],
    worldCupHistory: [
      { edition: 'Copa 2022', team: 'Brasil', result: 'Quartas-de-final' },
    ],
    stats: { goals: 15, assists: 10, matchesPlayed: 40, worldCupsPlayed: 1 },
  },
  {
    id: 'p5', name: 'Rodrygo', number: 10, position: 'Atacante', teamId: 't1',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rodrygo',
    awards: [],
    worldCupHistory: [
      { edition: 'Copa 2022', team: 'Brasil', result: 'Quartas-de-final' },
    ],
    stats: { goals: 10, assists: 8, matchesPlayed: 35, worldCupsPlayed: 1 },
  },

  // Argentina (t2)
  {
    id: 'p6', name: 'Dibu Martínez', number: 23, position: 'Goleiro', teamId: 't2',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dibu',
    awards: ['MELHOR GOLEIRO'],
    worldCupHistory: [
      { edition: 'Copa 2022', team: 'Argentina', result: 'Campeão' },
    ],
    stats: { goals: 0, assists: 0, matchesPlayed: 45, worldCupsPlayed: 1 },
  },
  {
    id: 'p7', name: 'Cuti Romero', number: 13, position: 'Defensor', teamId: 't2',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cutir',
    awards: [],
    worldCupHistory: [
      { edition: 'Copa 2022', team: 'Argentina', result: 'Campeão' },
    ],
    stats: { goals: 3, assists: 1, matchesPlayed: 40, worldCupsPlayed: 1 },
  },
  {
    id: 'p8', name: 'Enzo Fernández', number: 24, position: 'Meio-campista', teamId: 't2',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=enzo',
    awards: ['MELHOR JOVEM'],
    worldCupHistory: [
      { edition: 'Copa 2022', team: 'Argentina', result: 'Campeão' },
    ],
    stats: { goals: 4, assists: 5, matchesPlayed: 30, worldCupsPlayed: 1 },
  },
  {
    id: 'p9', name: 'Lionel Messi', number: 10, position: 'Atacante', teamId: 't2',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=messi',
    awards: ['ARTILHEIRO', 'MVP', 'MELHOR JOGADOR'],
    worldCupHistory: [
      { edition: 'Copa 2006', team: 'Argentina', result: 'Segunda fase' },
      { edition: 'Copa 2010', team: 'Argentina', result: 'Quartas-de-final' },
      { edition: 'Copa 2014', team: 'Argentina', result: 'Vice-campeão' },
      { edition: 'Copa 2018', team: 'Argentina', result: 'Segunda fase' },
      { edition: 'Copa 2022', team: 'Argentina', result: 'Campeão' },
    ],
    stats: { goals: 106, assists: 56, matchesPlayed: 180, worldCupsPlayed: 5 },
  },
  {
    id: 'p10', name: 'Julián Álvarez', number: 9, position: 'Atacante', teamId: 't2',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=julian',
    awards: [],
    worldCupHistory: [
      { edition: 'Copa 2022', team: 'Argentina', result: 'Campeão' },
    ],
    stats: { goals: 15, assists: 5, matchesPlayed: 35, worldCupsPlayed: 1 },
  },

  // França (t3)
  {
    id: 'p11', name: 'Mike Maignan', number: 16, position: 'Goleiro', teamId: 't3',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maignan',
    awards: [],
    worldCupHistory: [],
    stats: { goals: 0, assists: 0, matchesPlayed: 20, worldCupsPlayed: 0 },
  },
  {
    id: 'p12', name: 'Theo Hernández', number: 22, position: 'Defensor', teamId: 't3',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=theo',
    awards: [],
    worldCupHistory: [
      { edition: 'Copa 2022', team: 'França', result: 'Vice-campeão' },
    ],
    stats: { goals: 4, assists: 8, matchesPlayed: 30, worldCupsPlayed: 1 },
  },
  {
    id: 'p13', name: 'Aurélien Tchouaméni', number: 8, position: 'Meio-campista', teamId: 't3',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aurélien',
    awards: [],
    worldCupHistory: [
      { edition: 'Copa 2022', team: 'França', result: 'Vice-campeão' },
    ],
    stats: { goals: 3, assists: 2, matchesPlayed: 35, worldCupsPlayed: 1 },
  },
  {
    id: 'p14', name: 'Kylian Mbappé', number: 10, position: 'Atacante', teamId: 't3',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mbappe',
    awards: ['ARTILHEIRO', 'MELHOR JOVEM'],
    worldCupHistory: [
      { edition: 'Copa 2018', team: 'França', result: 'Campeão' },
      { edition: 'Copa 2022', team: 'França', result: 'Vice-campeão' },
    ],
    stats: { goals: 46, assists: 20, matchesPlayed: 75, worldCupsPlayed: 2 },
  },
  {
    id: 'p15', name: 'Antoine Griezmann', number: 7, position: 'Meio-campista', teamId: 't3',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=griezmann',
    awards: ['MVP'],
    worldCupHistory: [
      { edition: 'Copa 2014', team: 'França', result: 'Quartas-de-final' },
      { edition: 'Copa 2018', team: 'França', result: 'Campeão' },
      { edition: 'Copa 2022', team: 'França', result: 'Vice-campeão' },
    ],
    stats: { goals: 44, assists: 30, matchesPlayed: 125, worldCupsPlayed: 3 },
  },
];

