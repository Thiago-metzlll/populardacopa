import { PredictionRepository } from '../repositories/PredictionRepository';
import { PredictionHistory } from '../entities/PredictionHistory';
import { GetPredictionHistory } from './GetPredictionHistory';

describe('GetPredictionHistory', () => {
  it('delega para predictionRepository.getPredictionHistory com o userId', async () => {
    const expected: PredictionHistory = { predictions: [], totalPoints: 120, successRate: 0.6 };
    const predictionRepository = {
      getPredictionHistory: jest.fn().mockResolvedValue(expected),
    } as unknown as PredictionRepository;

    const result = await new GetPredictionHistory(predictionRepository).execute('u1');

    expect(predictionRepository.getPredictionHistory).toHaveBeenCalledWith('u1');
    expect(result).toBe(expected);
  });
});
