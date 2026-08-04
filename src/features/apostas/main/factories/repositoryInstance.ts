import { SQLiteMatchRepository } from '../../infra/repositories/SQLiteMatchRepository';
import { FirestorePredictionRepository } from '../../infra/repositories/FirestorePredictionRepository';

export const matchRepositoryInstance = new SQLiteMatchRepository();
export const predictionRepositoryInstance = new FirestorePredictionRepository();

