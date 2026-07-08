import { GetMarketAlbums } from '../../domain/usecases/GetMarketAlbums';
import { albumRepositoryInstance } from './repositoryInstance';

export const makeGetMarketAlbums = (): GetMarketAlbums => {
  return new GetMarketAlbums(albumRepositoryInstance);
};
