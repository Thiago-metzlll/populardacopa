import { TeamRepository } from '../repositories/TeamRepository';

export class ToggleFavoriteTeam {
  constructor(private readonly teamRepository: TeamRepository) {}

  async execute(userId: string, teamId: string): Promise<void> {
    return this.teamRepository.toggleFavorite(userId, teamId);
  }
}
