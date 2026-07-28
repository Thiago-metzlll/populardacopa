import { CreatePrediction } from './CreatePrediction';
import { PredictionRepository } from '../repositories/PredictionRepository';
import { Prediction } from '../entities/Prediction';

describe('CreatePrediction', () => {
  it('delega a criação da predição para o repositório com os dados recebidos e retorna o resultado', async () => {
    const predictionData = {
      userId: 'user-1',
      matchId: 'match-1',
      predictedHomeScore: 2,
      predictedAwayScore: 0,
      reward: { type: 'coins' as const, description: 'Moedas', coinAmount: 50 },
    };
    const expected: Prediction = { id: 'pred-1', ...predictionData, status: 'pending', createdAt: '2026-07-28T00:00:00.000Z' };
    const predictionRepository = {
      createPrediction: jest.fn(async () => expected),
    } as unknown as PredictionRepository;
    const sut = new CreatePrediction(predictionRepository);

    const result = await sut.execute(predictionData);

    expect(predictionRepository.createPrediction).toHaveBeenCalledWith(predictionData);
    expect(result).toBe(expected);
  });
});
