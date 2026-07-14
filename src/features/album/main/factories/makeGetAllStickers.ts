import { GetAllStickers } from '../../domain/usecases/GetAllStickers';
import { albumRepositoryInstance } from './repositoryInstance';

export const makeGetAllStickers = (): GetAllStickers => {
  return new GetAllStickers(albumRepositoryInstance);
};
