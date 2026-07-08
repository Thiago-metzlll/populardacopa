import { Team } from '../entities/Team';
import { Player } from '../entities/Player';

export interface TeamRepository {
  getFavoriteTeams(userId: string): Promise<Team[]>;
  searchTeams(userId: string, query: string): Promise<Team[]>;
  toggleFavorite(userId: string, teamId: string): Promise<void>;
  getById(teamId: string): Promise<Team>;
  getPlayersByTeam(teamId: string): Promise<Player[]>;
}
