import { Prediction } from '../../domain/entities/Prediction';
import { PredictionHistory } from '../../domain/entities/PredictionHistory';
import { PredictionRepository } from '../../domain/repositories/PredictionRepository';
import { mockPredictionHistory } from '../seed/PredictionSeed';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class MockPredictionRepository implements PredictionRepository {
  private historyState: PredictionHistory = { 
    ...mockPredictionHistory, 
    predictions: [...mockPredictionHistory.predictions] 
  };

  async getPredictionHistory(userId: string): Promise<PredictionHistory> {
    await delay(350);
    return this.historyState;
  }

  async createPrediction(predictionData: Omit<Prediction, 'id' | 'createdAt' | 'status'>): Promise<Prediction> {
    await delay(400);
    const newPrediction: Prediction = {
      ...predictionData,
      id: `pred_${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    this.historyState.predictions.push(newPrediction);
    
    return newPrediction;
  }
}
