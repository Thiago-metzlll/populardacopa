import { Team } from '../entities/Team';

export interface TeamRepository {
  getFavoriteTeams(userId: string): Promise<Team[]>;
  searchTeams(userId: string, query: string): Promise<Team[]>;
  toggleFavorite(userId: string, teamId: string): Promise<void>;
}
