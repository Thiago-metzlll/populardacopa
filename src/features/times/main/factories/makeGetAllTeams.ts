import { GetAllTeams } from '../../domain/usecases/GetAllTeams';
import { teamRepositoryInstance } from './repositoryInstance';

export const makeGetAllTeams = (): GetAllTeams => {
  return new GetAllTeams(teamRepositoryInstance);
};
