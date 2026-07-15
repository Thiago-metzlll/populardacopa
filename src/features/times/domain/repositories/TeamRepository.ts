import { Team } from '../entities/Team';
import { Player } from '../entities/Player';

export interface TeamRepository {
  getAllTeams(): Promise<Team[]>;
  getFavoriteTeams(userId: string): Promise<Team[]>;
  searchTeams(userId: string | undefined, query: string): Promise<Team[]>;
  toggleFavorite(userId: string, teamId: string): Promise<void>;
  getById(teamId: string): Promise<Team>;
  getPlayersByTeam(teamId: string): Promise<Player[]>;
  getPlayerById(playerId: string): Promise<Player>;
}

