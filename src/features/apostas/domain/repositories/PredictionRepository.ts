import { Prediction } from '../entities/Prediction';
import { PredictionHistory } from '../entities/PredictionHistory';

export interface PredictionRepository {
  getPredictionHistory(userId: string): Promise<PredictionHistory>;
  createPrediction(prediction: Omit<Prediction, 'id' | 'createdAt' | 'status'>): Promise<Prediction>;
  updatePredictionStatus(predictionId: string, status: 'won' | 'lost'): Promise<Prediction>;
}
