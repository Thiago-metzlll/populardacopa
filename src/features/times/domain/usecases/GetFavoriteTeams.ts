import { Team } from '../entities/Team';
import { TeamRepository } from '../repositories/TeamRepository';

export class GetFavoriteTeams {
  constructor(private readonly teamRepository: TeamRepository) {}

  async execute(userId: string): Promise<Team[]> {
    return this.teamRepository.getFavoriteTeams(userId);
  }
}
