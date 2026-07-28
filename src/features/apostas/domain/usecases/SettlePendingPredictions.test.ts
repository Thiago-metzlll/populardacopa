import { SettlePendingPredictions, RewardGranter } from './SettlePendingPredictions';
import { PredictionRepository } from '../repositories/PredictionRepository';
import { MatchRepository } from '../repositories/MatchRepository';
import { Prediction } from '../entities/Prediction';
import { Match } from '../entities/Match';

const makePrediction = (overrides: Partial<Prediction> = {}): Prediction => ({
  id: 'pred-1',
  userId: 'user-1',
  matchId: 'match-1',
  predictedHomeScore: 2,
  predictedAwayScore: 1,
  reward: { type: 'coins', description: 'Moedas', coinAmount: 100 },
  status: 'pending',
  createdAt: '2026-07-01T00:00:00.000Z',
  ...overrides,
});

const makeMatch = (overrides: Partial<Match> = {}): Match => ({
  id: 'match-1',
  homeTeamId: 'team-a',
  awayTeamId: 'team-b',
  homeScore: 2,
  awayScore: 1,
  date: '2026-07-01T00:00:00.000Z',
  phase: 'grupos',
  status: 'finished',
  ...overrides,
});

const makeSut = (predictions: Prediction[], matches: Record<string, Match | null>) => {
  const updatePredictionStatus = jest.fn(
    async (predictionId: string, status: 'won' | 'lost'): Promise<Prediction> => {
      const original = predictions.find((p) => p.id === predictionId)!;
      return { ...original, status };
    },
  );

  const predictionRepository: PredictionRepository = {
    getPredictionHistory: jest.fn(async () => ({
      predictions,
      totalPoints: 0,
      successRate: 0,
    })),
    createPrediction: jest.fn(),
    updatePredictionStatus,
  };

  const matchRepository: MatchRepository = {
    getUpcomingMatches: jest.fn(),
    getMatchById: jest.fn(async (matchId: string) => matches[matchId] ?? null),
  };

  const rewardGranter: RewardGranter = {
    grantCoins: jest.fn(),
    grantStickers: jest.fn(),
  };

  const sut = new SettlePendingPredictions(predictionRepository, matchRepository, rewardGranter);

  return { sut, predictionRepository, matchRepository, rewardGranter };
};

describe('SettlePendingPredictions', () => {
  it('ignora predições que não estão pendentes', async () => {
    const predictions = [makePrediction({ id: 'p1', status: 'won' })];
    const { sut, predictionRepository } = makeSut(predictions, {});

    const result = await sut.execute('user-1');

    expect(result).toEqual([]);
    expect(predictionRepository.updatePredictionStatus).not.toHaveBeenCalled();
  });

  it('ignora predições cuja partida ainda não terminou', async () => {
    const predictions = [makePrediction({ id: 'p1', matchId: 'match-1' })];
    const matches = { 'match-1': makeMatch({ status: 'live', homeScore: undefined, awayScore: undefined }) };
    const { sut, predictionRepository } = makeSut(predictions, matches);

    const result = await sut.execute('user-1');

    expect(result).toEqual([]);
    expect(predictionRepository.updatePredictionStatus).not.toHaveBeenCalled();
  });

  it('ignora predições cuja partida não existe mais', async () => {
    const predictions = [makePrediction({ id: 'p1', matchId: 'match-x' })];
    const { sut, predictionRepository } = makeSut(predictions, { 'match-x': null });

    const result = await sut.execute('user-1');

    expect(result).toEqual([]);
    expect(predictionRepository.updatePredictionStatus).not.toHaveBeenCalled();
  });

  it('marca como vencedora quando o placar previsto bate e concede moedas', async () => {
    const predictions = [
      makePrediction({
        id: 'p1',
        matchId: 'match-1',
        predictedHomeScore: 2,
        predictedAwayScore: 1,
        reward: { type: 'coins', description: 'Moedas', coinAmount: 150 },
      }),
    ];
    const matches = { 'match-1': makeMatch({ homeScore: 2, awayScore: 1 }) };
    const { sut, predictionRepository, rewardGranter } = makeSut(predictions, matches);

    const result = await sut.execute('user-1');

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('won');
    expect(predictionRepository.updatePredictionStatus).toHaveBeenCalledWith('p1', 'won');
    expect(rewardGranter.grantCoins).toHaveBeenCalledWith('user-1', 150);
    expect(rewardGranter.grantStickers).not.toHaveBeenCalled();
  });

  it('marca como perdedora quando o placar previsto não bate e não concede recompensa', async () => {
    const predictions = [makePrediction({ id: 'p1', matchId: 'match-1', predictedHomeScore: 3, predictedAwayScore: 0 })];
    const matches = { 'match-1': makeMatch({ homeScore: 2, awayScore: 1 }) };
    const { sut, predictionRepository, rewardGranter } = makeSut(predictions, matches);

    const result = await sut.execute('user-1');

    expect(result[0].status).toBe('lost');
    expect(predictionRepository.updatePredictionStatus).toHaveBeenCalledWith('p1', 'lost');
    expect(rewardGranter.grantCoins).not.toHaveBeenCalled();
    expect(rewardGranter.grantStickers).not.toHaveBeenCalled();
  });

  it('concede stickers quando a recompensa vencedora é do tipo sticker', async () => {
    const predictions = [
      makePrediction({
        id: 'p1',
        matchId: 'match-1',
        predictedHomeScore: 2,
        predictedAwayScore: 1,
        reward: { type: 'sticker', description: 'Figurinha rara', stickerIds: ['s1', 's2'] },
      }),
    ];
    const matches = { 'match-1': makeMatch({ homeScore: 2, awayScore: 1 }) };
    const { sut, rewardGranter } = makeSut(predictions, matches);

    await sut.execute('user-1');

    expect(rewardGranter.grantStickers).toHaveBeenCalledWith('user-1', ['s1', 's2']);
    expect(rewardGranter.grantCoins).not.toHaveBeenCalled();
  });
});
