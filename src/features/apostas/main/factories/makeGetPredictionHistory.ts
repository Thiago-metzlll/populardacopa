import { GetPredictionHistory } from '../../domain/usecases/GetPredictionHistory';
import { predictionRepositoryInstance } from './repositoryInstance';

export const makeGetPredictionHistory = (): GetPredictionHistory => {
  return new GetPredictionHistory(predictionRepositoryInstance);
};
