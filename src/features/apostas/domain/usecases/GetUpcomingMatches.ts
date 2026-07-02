import { Match } from '../entities/Match';
import { MatchRepository } from '../repositories/MatchRepository';

export class GetUpcomingMatches {
  constructor(private readonly matchRepository: MatchRepository) {}

  async execute(): Promise<Match[]> {
    return this.matchRepository.getUpcomingMatches();
  }
}
