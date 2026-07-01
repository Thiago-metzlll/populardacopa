import { OpenPackage } from '../../domain/usecases/OpenPackage';
import { albumRepositoryInstance } from './repositoryInstance';

export const makeOpenPackage = (): OpenPackage => {
  return new OpenPackage(albumRepositoryInstance);
};
