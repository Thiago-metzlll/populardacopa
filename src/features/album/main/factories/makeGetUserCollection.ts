import { GetUserCollection } from '../../domain/usecases/GetUserCollection';
import { albumRepositoryInstance } from './repositoryInstance';

export const makeGetUserCollection = (): GetUserCollection => {
  return new GetUserCollection(albumRepositoryInstance);
};
