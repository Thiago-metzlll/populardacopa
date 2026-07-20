import { GrantStickers } from '../../domain/usecases/GrantStickers';
import { albumRepositoryInstance } from './repositoryInstance';

export const makeGrantStickers = (): GrantStickers => {
  return new GrantStickers(albumRepositoryInstance);
};
