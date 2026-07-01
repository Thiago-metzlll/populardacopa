import { Team } from '../../domain/entities/Team';

export const mockTeams: Team[] = [
  { id: 't1', name: 'Brasil', countryId: 'br', groupId: 'g1', ranking: 1, winRate: 0.8, isFavorite: true },
  { id: 't2', name: 'Argentina', countryId: 'ar', groupId: 'g1', ranking: 2, winRate: 0.75, isFavorite: false },
  { id: 't3', name: 'França', countryId: 'fr', groupId: 'g1', ranking: 3, winRate: 0.7, isFavorite: true },
  { id: 't4', name: 'Alemanha', countryId: 'de', groupId: 'g1', ranking: 4, winRate: 0.65, isFavorite: false },
  { id: 't5', name: 'Espanha', countryId: 'es', groupId: 'g2', ranking: 5, winRate: 0.6, isFavorite: false },
  { id: 't6', name: 'Inglaterra', countryId: 'gb', groupId: 'g2', ranking: 6, winRate: 0.58, isFavorite: true },
  { id: 't7', name: 'Portugal', countryId: 'pt', groupId: 'g2', ranking: 7, winRate: 0.55, isFavorite: false },
  { id: 't8', name: 'Itália', countryId: 'it', groupId: 'g2', ranking: 8, winRate: 0.52, isFavorite: false },
  { id: 't9', name: 'Uruguai', countryId: 'uy', groupId: 'g3', ranking: 9, winRate: 0.5, isFavorite: true },
];
