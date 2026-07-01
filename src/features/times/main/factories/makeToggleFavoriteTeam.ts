import { ToggleFavoriteTeam } from '../../domain/usecases/ToggleFavoriteTeam';
import { teamRepositoryInstance } from './repositoryInstance';

export const makeToggleFavoriteTeam = (): ToggleFavoriteTeam => {
  return new ToggleFavoriteTeam(teamRepositoryInstance);
};
