import { Match } from '../../domain/entities/Match';
import { MatchRepository } from '../../domain/repositories/MatchRepository';
import { mockMatches } from '../seed/MatchSeed';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class MockMatchRepository implements MatchRepository {
  private matchesState: Match[] = [...mockMatches];

  async getUpcomingMatches(): Promise<Match[]> {
    await delay(300);
    return this.matchesState.filter(m => m.status === 'scheduled');
  }

  async getMatchById(matchId: string): Promise<Match | null> {
    await delay(150);
    return this.matchesState.find(m => m.id === matchId) ?? null;
  }
}
