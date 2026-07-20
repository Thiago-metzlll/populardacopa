import { Match } from '../entities/Match';

export interface MatchRepository {
  getUpcomingMatches(): Promise<Match[]>;
  getMatchById(matchId: string): Promise<Match | null>;
}
