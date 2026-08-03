import { makeMatch } from '../../../../../../test/fixtures';
import { MatchRepository } from '../../../domain/repositories/MatchRepository';
import { GetUpcomingMatches } from '../../../domain/usecases/GetUpcomingMatches';

describe('GetUpcomingMatches', () => {
  it('delega para matchRepository.getUpcomingMatches sem argumentos', async () => {
    const matches = [makeMatch({ id: 'm1' }), makeMatch({ id: 'm2' })];
    const matchRepository = {
      getUpcomingMatches: jest.fn().mockResolvedValue(matches),
    } as unknown as MatchRepository;

    const result = await new GetUpcomingMatches(matchRepository).execute();

    expect(matchRepository.getUpcomingMatches).toHaveBeenCalledWith();
    expect(result).toBe(matches);
  });
});
