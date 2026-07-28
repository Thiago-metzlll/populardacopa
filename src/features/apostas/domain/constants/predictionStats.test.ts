import { computePredictionStats } from './predictionStats';
import { Prediction } from '../entities/Prediction';

const makePrediction = (overrides: Partial<Prediction>): Prediction => ({
  id: 'p',
  userId: 'user-1',
  matchId: 'match-1',
  predictedHomeScore: 1,
  predictedAwayScore: 0,
  reward: { type: 'coins', description: 'Moedas', coinAmount: 100 },
  status: 'pending',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('computePredictionStats', () => {
  it('retorna 0/0 quando não há predições', () => {
    expect(computePredictionStats([])).toEqual({ successRate: 0, totalPoints: 0 });
  });

  it('retorna 0/0 quando só há predições pendentes (nenhuma resolvida)', () => {
    const predictions = [makePrediction({ status: 'pending' }), makePrediction({ status: 'pending' })];

    expect(computePredictionStats(predictions)).toEqual({ successRate: 0, totalPoints: 0 });
  });

  it('calcula successRate só sobre predições resolvidas, ignorando pendentes', () => {
    const predictions = [
      makePrediction({ status: 'won' }),
      makePrediction({ status: 'lost' }),
      makePrediction({ status: 'pending' }),
    ];

    expect(computePredictionStats(predictions).successRate).toBe(50);
  });

  it('soma coinAmount só das predições vencedoras em totalPoints', () => {
    const predictions = [
      makePrediction({ status: 'won', reward: { type: 'coins', description: 'x', coinAmount: 100 } }),
      makePrediction({ status: 'won', reward: { type: 'sticker', description: 'y', stickerIds: ['s1'] } }),
      makePrediction({ status: 'lost', reward: { type: 'coins', description: 'z', coinAmount: 999 } }),
    ];

    expect(computePredictionStats(predictions).totalPoints).toBe(100);
  });

  it('arredonda o successRate', () => {
    const predictions = [
      makePrediction({ status: 'won' }),
      makePrediction({ status: 'lost' }),
      makePrediction({ status: 'lost' }),
    ];

    expect(computePredictionStats(predictions).successRate).toBe(33);
  });
});
