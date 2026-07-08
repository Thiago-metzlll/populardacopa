import { BuyStickerPack } from '../../domain/usecases/BuyStickerPack';
import { albumRepositoryInstance } from './repositoryInstance';

export const makeBuyStickerPack = (): BuyStickerPack => {
  return new BuyStickerPack(albumRepositoryInstance);
};
