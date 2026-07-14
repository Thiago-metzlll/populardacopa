import { BuyIndividualSticker } from '../../domain/usecases/BuyIndividualSticker';
import { albumRepositoryInstance } from './repositoryInstance';

export const makeBuyIndividualSticker = (): BuyIndividualSticker => {
  return new BuyIndividualSticker(albumRepositoryInstance);
};
