import { Prediction } from './Prediction';

export interface PredictionHistory {
  predictions: Prediction[];
  totalPoints: number;
  successRate: number;
}
