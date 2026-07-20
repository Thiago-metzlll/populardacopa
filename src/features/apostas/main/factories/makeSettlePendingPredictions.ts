import { SettlePendingPredictions } from '../../domain/usecases/SettlePendingPredictions';
import { predictionRepositoryInstance, matchRepositoryInstance } from './repositoryInstance';
import { makeAddUserCoins } from '../../../album/main/factories/makeAddUserCoins';
import { makeGrantStickers } from '../../../album/main/factories/makeGrantStickers';

/**
 * Composição cross-feature: apostas não conhece album diretamente no domínio,
 * só aqui no Main, onde a recompensa de um palpite vencedor é traduzida em
 * chamadas concretas para as factories de moedas/figurinhas do álbum.
 */
export const makeSettlePendingPredictions = (): SettlePendingPredictions => {
  return new SettlePendingPredictions(predictionRepositoryInstance, matchRepositoryInstance, {
    grantCoins: async (userId, amount) => {
      await makeAddUserCoins().execute(userId, amount);
    },
    grantStickers: async (userId, stickerIds) => {
      await makeGrantStickers().execute(userId, stickerIds);
    },
  });
};
