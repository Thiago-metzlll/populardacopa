import { GetAllGroups } from '../../domain/usecases/GetAllGroups';
import { groupRepositoryInstance } from './repositoryInstance';

export const makeGetAllGroups = (): GetAllGroups => {
  return new GetAllGroups(groupRepositoryInstance);
};
