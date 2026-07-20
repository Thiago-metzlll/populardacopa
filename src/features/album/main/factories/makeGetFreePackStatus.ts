import { GetFreePackStatus } from '../../domain/usecases/GetFreePackStatus';
import { albumRepositoryInstance } from './repositoryInstance';

export const makeGetFreePackStatus = (): GetFreePackStatus => {
  return new GetFreePackStatus(albumRepositoryInstance);
};
