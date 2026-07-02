import { Prediction } from '../entities/Prediction';
import { PredictionRepository } from '../repositories/PredictionRepository';

export class CreatePrediction {
  constructor(private readonly predictionRepository: PredictionRepository) {}

  async execute(predictionData: Omit<Prediction, 'id' | 'createdAt' | 'status'>): Promise<Prediction> {
    return this.predictionRepository.createPrediction(predictionData);
  }
}
