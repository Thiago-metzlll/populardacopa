import { GetDailyCoinsStatus } from '../../domain/usecases/GetDailyCoinsStatus';
import { albumRepositoryInstance } from './repositoryInstance';

export const makeGetDailyCoinsStatus = (): GetDailyCoinsStatus => {
  return new GetDailyCoinsStatus(albumRepositoryInstance);
};
