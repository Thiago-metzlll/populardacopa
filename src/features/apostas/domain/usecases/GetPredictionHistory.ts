import { PredictionHistory } from '../entities/PredictionHistory';
import { PredictionRepository } from '../repositories/PredictionRepository';

export class GetPredictionHistory {
  constructor(private readonly predictionRepository: PredictionRepository) {}

  async execute(userId: string): Promise<PredictionHistory> {
    return this.predictionRepository.getPredictionHistory(userId);
  }
}
