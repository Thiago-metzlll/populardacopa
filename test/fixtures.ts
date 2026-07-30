import { User } from '../src/shared/domain/entities/User';
import { Sticker } from '../src/features/album/domain/entities/Sticker';
import { Team } from '../src/features/times/domain/entities/Team';
import { Player } from '../src/features/times/domain/entities/Player';
import { Match } from '../src/features/apostas/domain/entities/Match';

/** Fixtures compartilhadas entre os testes de hooks e componentes. */

export const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'u1',
  name: 'Fulano',
  email: 'fulano@a.com',
  coins: 100,
  favoriteTeamIds: [],
  ...overrides,
});

export const makeSticker = (overrides: Partial<Sticker> = {}): Sticker => ({
  id: 's1',
  albumId: 'a1',
  playerName: 'Fulano da Silva',
  price: 50,
  rarity: 'comum',
  imageUrl: 'https://img/foto.png',
  obtainedAt: '2026-03-15T12:00:00.000Z',
  ...overrides,
});

export const makeTeam = (overrides: Partial<Team> = {}): Team => ({
  id: 'bra',
  name: 'Brasil',
  countryId: 'br',
  groupId: 'g1',
  ranking: 1,
  winRate: 0.8,
  isFavorite: false,
  titles: ['1958', '1962'],
  worldCupWins: 5,
  description: 'Seleção brasileira',
  isUnbeaten: false,
  ...overrides,
});

export const makePlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'p1',
  name: 'Fulano',
  number: 10,
  position: 'MEI',
  teamId: 'bra',
  stats: { goals: 0, assists: 0, matchesPlayed: 0, worldCupsPlayed: 0 },
  ...overrides,
});

export const makeMatch = (overrides: Partial<Match> = {}): Match => ({
  id: 'm1',
  homeTeamId: 'bra',
  awayTeamId: 'arg',
  date: '2026-06-11T21:00:00.000Z',
  phase: 'grupos',
  status: 'scheduled',
  ...overrides,
});
