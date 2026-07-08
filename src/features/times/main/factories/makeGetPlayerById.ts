import { GetPlayerById } from '../../domain/usecases/GetPlayerById';
import { teamRepositoryInstance } from './repositoryInstance';

export const makeGetPlayerById = (): GetPlayerById => {
  return new GetPlayerById(teamRepositoryInstance);
};
