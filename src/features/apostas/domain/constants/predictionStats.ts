import { Prediction } from '../entities/Prediction';

/**
 * Pura: calcula o aproveitamento (% de acerto entre predições já resolvidas)
 * e a pontuação total (soma das moedas ganhas nas predições vencedoras).
 */
export function computePredictionStats(predictions: Prediction[]): { successRate: number; totalPoints: number } {
  const settled = predictions.filter((p) => p.status !== 'pending');
  const won = predictions.filter((p) => p.status === 'won');

  const successRate = settled.length > 0 ? Math.round((won.length / settled.length) * 100) : 0;
  const totalPoints = won.reduce((acc, p) => acc + (p.reward.coinAmount || 0), 0);

  return { successRate, totalPoints };
}
