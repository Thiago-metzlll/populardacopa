import { GetFavoriteTeams } from '../../domain/usecases/GetFavoriteTeams';
import { teamRepositoryInstance } from './repositoryInstance';

export const makeGetFavoriteTeams = (): GetFavoriteTeams => {
  return new GetFavoriteTeams(teamRepositoryInstance);
};
