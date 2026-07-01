import { Team } from '../entities/Team';
import { TeamRepository } from '../repositories/TeamRepository';

export class SearchTeams {
  constructor(private readonly teamRepository: TeamRepository) {}

  async execute(userId: string, query: string): Promise<Team[]> {
    return this.teamRepository.searchTeams(userId, query);
  }
}
