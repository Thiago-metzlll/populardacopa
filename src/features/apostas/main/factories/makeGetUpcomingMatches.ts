import { GetUpcomingMatches } from '../../domain/usecases/GetUpcomingMatches';
import { matchRepositoryInstance } from './repositoryInstance';

export const makeGetUpcomingMatches = (): GetUpcomingMatches => {
  return new GetUpcomingMatches(matchRepositoryInstance);
};
