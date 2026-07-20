import { AddUserCoins } from '../../domain/usecases/AddUserCoins';
import { albumRepositoryInstance } from './repositoryInstance';

export const makeAddUserCoins = (): AddUserCoins => {
  return new AddUserCoins(albumRepositoryInstance);
};
