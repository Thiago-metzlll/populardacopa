import { ToggleFavoriteTeam } from '../../../domain/usecases/ToggleFavoriteTeam';
import { TeamRepository } from '../../../domain/repositories/TeamRepository';

describe('ToggleFavoriteTeam', () => {
  it('delega o toggle de favorito para o repositório com os argumentos recebidos', async () => {
    const teamRepository = {
      toggleFavorite: jest.fn(async () => undefined),
    } as unknown as TeamRepository;
    const sut = new ToggleFavoriteTeam(teamRepository);

    await sut.execute('user-1', 'team-1');

    expect(teamRepository.toggleFavorite).toHaveBeenCalledWith('user-1', 'team-1');
  });
});
