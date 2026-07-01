import { SearchTeams } from '../../domain/usecases/SearchTeams';
import { teamRepositoryInstance } from './repositoryInstance';

export const makeSearchTeams = (): SearchTeams => {
  return new SearchTeams(teamRepositoryInstance);
};
