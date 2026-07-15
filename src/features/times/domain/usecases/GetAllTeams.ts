import { Team } from '../entities/Team';
import { TeamRepository } from '../repositories/TeamRepository';

export class GetAllTeams {
  constructor(private readonly teamRepository: TeamRepository) {}

  async execute(): Promise<Team[]> {
    return this.teamRepository.getAllTeams();
  }
}
