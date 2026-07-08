import { Team } from '../entities/Team';
import { Player } from '../entities/Player';
import { TeamRepository } from '../repositories/TeamRepository';

export class GetTeamById {
  constructor(private readonly teamRepository: TeamRepository) {}

  async execute(teamId: string): Promise<{ team: Team; players: Player[] }> {
    const team = await this.teamRepository.getById(teamId);
    const players = await this.teamRepository.getPlayersByTeam(teamId);
    return { team, players };
  }
}
