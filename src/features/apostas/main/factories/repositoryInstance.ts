import { SQLiteMatchRepository } from '../../infra/repositories/SQLiteMatchRepository';
import { MockPredictionRepository } from '../../infra/repositories/MockPredictionRepository';

export const matchRepositoryInstance = new SQLiteMatchRepository();
export const predictionRepositoryInstance = new MockPredictionRepository();

