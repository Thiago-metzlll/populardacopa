import { Team } from '../../domain/entities/Team';
import { TeamRepository } from '../../domain/repositories/TeamRepository';
import { mockTeams } from '../seed/TeamSeed';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export class MockTeamRepository implements TeamRepository {
  private teamsState: Team[] = [...mockTeams];

  async getFavoriteTeams(userId: string): Promise<Team[]> {
    await delay(300);
    return this.teamsState.filter((t) => t.isFavorite);
  }

  async searchTeams(userId: string, query: string): Promise<Team[]> {
    await delay(400);
    const lowerQuery = query.toLowerCase();
    return this.teamsState.filter((t) => 
      t.isFavorite && t.name.toLowerCase().includes(lowerQuery)
    );
  }

  async toggleFavorite(userId: string, teamId: string): Promise<void> {
    await delay(250);
    const teamIndex = this.teamsState.findIndex((t) => t.id === teamId);
    if (teamIndex !== -1) {
      this.teamsState[teamIndex] = {
        ...this.teamsState[teamIndex],
        isFavorite: !this.teamsState[teamIndex].isFavorite
      };
    }
  }
}
