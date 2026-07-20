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

  async updatePredictionStatus(predictionId: string, status: 'won' | 'lost'): Promise<Prediction> {
    await delay(200);
    const prediction = this.historyState.predictions.find(p => p.id === predictionId);
    if (!prediction) throw new Error('Palpite não encontrado');

    prediction.status = status;

    const settled = this.historyState.predictions.filter(p => p.status !== 'pending');
    const won = this.historyState.predictions.filter(p => p.status === 'won');
    this.historyState.successRate = settled.length > 0 ? Math.round((won.length / settled.length) * 100) : 0;
    this.historyState.totalPoints = won.reduce((acc, p) => acc + (p.reward.coinAmount || 0), 0);

    return prediction;
  }
}
