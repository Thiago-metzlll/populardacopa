import { GetUserProfile } from '../../domain/usecases/GetUserProfile';
import { albumRepositoryInstance } from './repositoryInstance';

export const makeGetUserProfile = (): GetUserProfile => {
  return new GetUserProfile(albumRepositoryInstance);
};
