import { GetTeamById } from '../../domain/usecases/GetTeamById';
import { teamRepositoryInstance } from './repositoryInstance';

export const makeGetTeamById = (): GetTeamById => {
  return new GetTeamById(teamRepositoryInstance);
};
