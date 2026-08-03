import { makePlayer, makeTeam } from '../../../../../../test/fixtures';
import { TeamRepository } from '../../../domain/repositories/TeamRepository';
import { GetAllTeams } from '../../../domain/usecases/GetAllTeams';
import { GetFavoriteTeams } from '../../../domain/usecases/GetFavoriteTeams';
import { GetPlayerById } from '../../../domain/usecases/GetPlayerById';
import { GetTeamById } from '../../../domain/usecases/GetTeamById';
import { SearchTeams } from '../../../domain/usecases/SearchTeams';

/**
 * Estes use cases só delegam para o TeamRepository — a lógica de negócio
 * (SQLite, filtros) já é coberta pelos testes do repositório. Aqui garantimos
 * apenas que os argumentos certos chegam ao método certo, e que o retorno
 * passa direto.
 */
const makeRepository = (overrides: Partial<TeamRepository> = {}): TeamRepository =>
  ({
    getAllTeams: jest.fn(),
    getFavoriteTeams: jest.fn(),
    searchTeams: jest.fn(),
    toggleFavorite: jest.fn(),
    getById: jest.fn(),
    getPlayersByTeam: jest.fn(),
    getPlayerById: jest.fn(),
    ...overrides,
  }) as unknown as TeamRepository;

describe('GetAllTeams', () => {
  it('delega para teamRepository.getAllTeams e devolve o resultado', async () => {
    const teams = [makeTeam({ id: 'bra' })];
    const repository = makeRepository({ getAllTeams: jest.fn().mockResolvedValue(teams) });

    const result = await new GetAllTeams(repository).execute();

    expect(repository.getAllTeams).toHaveBeenCalledWith();
    expect(result).toBe(teams);
  });
});

describe('GetFavoriteTeams', () => {
  it('delega para teamRepository.getFavoriteTeams com o userId', async () => {
    const teams = [makeTeam({ id: 'bra', isFavorite: true })];
    const repository = makeRepository({ getFavoriteTeams: jest.fn().mockResolvedValue(teams) });

    const result = await new GetFavoriteTeams(repository).execute('u1');

    expect(repository.getFavoriteTeams).toHaveBeenCalledWith('u1');
    expect(result).toBe(teams);
  });
});

describe('GetPlayerById', () => {
  it('delega para teamRepository.getPlayerById com o playerId', async () => {
    const player = makePlayer({ id: 'p1' });
    const repository = makeRepository({ getPlayerById: jest.fn().mockResolvedValue(player) });

    const result = await new GetPlayerById(repository).execute('p1');

    expect(repository.getPlayerById).toHaveBeenCalledWith('p1');
    expect(result).toBe(player);
  });
});

describe('SearchTeams', () => {
  it('delega para teamRepository.searchTeams com userId e query', async () => {
    const teams = [makeTeam({ id: 'bra' })];
    const repository = makeRepository({ searchTeams: jest.fn().mockResolvedValue(teams) });

    const result = await new SearchTeams(repository).execute('u1', 'bra');

    expect(repository.searchTeams).toHaveBeenCalledWith('u1', 'bra');
    expect(result).toBe(teams);
  });

  it('repassa userId undefined quando não há usuário autenticado', async () => {
    const repository = makeRepository({ searchTeams: jest.fn().mockResolvedValue([]) });

    await new SearchTeams(repository).execute(undefined, 'bra');

    expect(repository.searchTeams).toHaveBeenCalledWith(undefined, 'bra');
  });
});

describe('GetTeamById', () => {
  it('busca o time e seus jogadores e combina os dois resultados', async () => {
    const team = makeTeam({ id: 'bra' });
    const players = [makePlayer({ id: 'p1', teamId: 'bra' })];
    const repository = makeRepository({
      getById: jest.fn().mockResolvedValue(team),
      getPlayersByTeam: jest.fn().mockResolvedValue(players),
    });

    const result = await new GetTeamById(repository).execute('bra');

    expect(repository.getById).toHaveBeenCalledWith('bra');
    expect(repository.getPlayersByTeam).toHaveBeenCalledWith('bra');
    expect(result).toEqual({ team, players });
  });

  it('propaga o erro quando o time não é encontrado, sem buscar jogadores', async () => {
    const repository = makeRepository({
      getById: jest.fn().mockRejectedValue(new Error('Time não encontrado')),
    });

    await expect(new GetTeamById(repository).execute('inexistente')).rejects.toThrow(
      'Time não encontrado',
    );
    expect(repository.getPlayersByTeam).not.toHaveBeenCalled();
  });
});
