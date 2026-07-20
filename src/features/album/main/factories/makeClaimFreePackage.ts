import { ClaimFreePackage } from '../../domain/usecases/ClaimFreePackage';
import { albumRepositoryInstance } from './repositoryInstance';

export const makeClaimFreePackage = (): ClaimFreePackage => {
  return new ClaimFreePackage(albumRepositoryInstance);
};
