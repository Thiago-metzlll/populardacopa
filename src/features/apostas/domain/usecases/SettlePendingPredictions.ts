import { Prediction } from '../entities/Prediction';
import { PredictionRepository } from '../repositories/PredictionRepository';
import { MatchRepository } from '../repositories/MatchRepository';

/**
 * Concede a recompensa de um palpite vencedor. Implementado no Main (factory),
 * que compõe as factories de `album` — o domínio de apostas não conhece álbum/moedas.
 */
export interface RewardGranter {
  grantCoins(userId: string, amount: number): Promise<void>;
  grantStickers(userId: string, stickerIds: string[]): Promise<void>;
}

export class SettlePendingPredictions {
  constructor(
    private readonly predictionRepository: PredictionRepository,
    private readonly matchRepository: MatchRepository,
    private readonly rewardGranter: RewardGranter,
  ) {}

  async execute(userId: string): Promise<Prediction[]> {
    const history = await this.predictionRepository.getPredictionHistory(userId);
    const pending = history.predictions.filter((p) => p.status === 'pending');

    const settled: Prediction[] = [];

    for (const prediction of pending) {
      const match = await this.matchRepository.getMatchById(prediction.matchId);
      if (!match || match.status !== 'finished' || match.homeScore == null || match.awayScore == null) {
        continue;
      }

      const won =
        match.homeScore === prediction.predictedHomeScore &&
        match.awayScore === prediction.predictedAwayScore;

      const updated = await this.predictionRepository.updatePredictionStatus(
        prediction.id,
        won ? 'won' : 'lost',
      );

      if (won) {
        if (prediction.reward.type === 'coins' && prediction.reward.coinAmount) {
          await this.rewardGranter.grantCoins(userId, prediction.reward.coinAmount);
        } else if (prediction.reward.type === 'sticker' && prediction.reward.stickerIds) {
          await this.rewardGranter.grantStickers(userId, prediction.reward.stickerIds);
        }
      }

      settled.push(updated);
    }

    return settled;
  }
}
