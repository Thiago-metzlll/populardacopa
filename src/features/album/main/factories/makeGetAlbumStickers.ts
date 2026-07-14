import { GetAlbumStickers } from '../../domain/usecases/GetAlbumStickers';
import { albumRepositoryInstance } from './repositoryInstance';

export const makeGetAlbumStickers = (): GetAlbumStickers => {
  return new GetAlbumStickers(albumRepositoryInstance);
};
