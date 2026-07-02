import { MockMatchRepository } from '../../infra/repositories/MockMatchRepository';
import { MockPredictionRepository } from '../../infra/repositories/MockPredictionRepository';

export const matchRepositoryInstance = new MockMatchRepository();
export const predictionRepositoryInstance = new MockPredictionRepository();
