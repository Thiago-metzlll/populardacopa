import { Player } from '../entities/Player';
import { TeamRepository } from '../repositories/TeamRepository';

export class GetPlayerById {
  constructor(private readonly teamRepository: TeamRepository) {}

  async execute(playerId: string): Promise<Player> {
    return this.teamRepository.getPlayerById(playerId);
  }
}
