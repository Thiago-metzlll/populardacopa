import { GetStickersByIds } from '../../domain/usecases/GetStickersByIds';
import { albumRepositoryInstance } from './repositoryInstance';

export const makeGetStickersByIds = (): GetStickersByIds => {
  return new GetStickersByIds(albumRepositoryInstance);
};
