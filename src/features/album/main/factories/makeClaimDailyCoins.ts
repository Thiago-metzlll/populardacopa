import { ClaimDailyCoins } from '../../domain/usecases/ClaimDailyCoins';
import { albumRepositoryInstance } from './repositoryInstance';

export const makeClaimDailyCoins = (): ClaimDailyCoins => {
  return new ClaimDailyCoins(albumRepositoryInstance);
};
