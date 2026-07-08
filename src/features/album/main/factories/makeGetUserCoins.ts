import { GetUserCoins } from '../../domain/usecases/GetUserCoins';
import { albumRepositoryInstance } from './repositoryInstance';

export const makeGetUserCoins = (): GetUserCoins => {
  return new GetUserCoins(albumRepositoryInstance);
};
