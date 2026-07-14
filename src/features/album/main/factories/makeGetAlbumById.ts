import { GetAlbumById } from '../../domain/usecases/GetAlbumById';
import { albumRepositoryInstance } from './repositoryInstance';

export const makeGetAlbumById = (): GetAlbumById => {
  return new GetAlbumById(albumRepositoryInstance);
};
