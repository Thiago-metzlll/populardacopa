import { CreatePrediction } from '../../domain/usecases/CreatePrediction';
import { predictionRepositoryInstance } from './repositoryInstance';

export const makeCreatePrediction = (): CreatePrediction => {
  return new CreatePrediction(predictionRepositoryInstance);
};
