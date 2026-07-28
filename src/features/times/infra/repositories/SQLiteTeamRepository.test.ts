jest.mock('../../../../shared/infra/sqlite/database', () => ({
  getSQLiteDb: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => 'USER_DOC_REF'),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  arrayUnion: jest.fn((...ids) => ({ __op: 'arrayUnion', ids })),
  arrayRemove: jest.fn((...ids) => ({ __op: 'arrayRemove', ids })),
}));

jest.mock('../../../../shared/infra/firebase/firebaseConfig', () => ({
  db: {},
}));

jest.mock('../../domain/constants/playerStats', () => ({
  generatePlayerStats: jest.fn(() => ({ goals: 1, assists: 2, matchesPlayed: 3, worldCupsPlayed: 1 })),
}));

import { getSQLiteDb } from '../../../../shared/infra/sqlite/database';
import { getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { SQLiteTeamRepository } from './SQLiteTeamRepository';

const mockDb = {
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
};

const teamRow = {
  id: 't1',
  name: 'Brasil',
  group_key: 'A',
  flag_url: 'https://flags.example.com/br.png',
  subtitle: null,
  ranking: 10,
  world_cup_wins: 5,
  description: 'Seleção brasileira',
  is_unbeaten: 1,
  titles: '["1958","1962"]',
};

beforeEach(() => {
  jest.clearAllMocks();
  (getSQLiteDb as jest.Mock).mockResolvedValue(mockDb);
});

describe('SQLiteTeamRepository', () => {
  const sut = new SQLiteTeamRepository();

  describe('getAllTeams', () => {
    it('mapeia countryId a partir da flag_url, parseia titles e calcula winRate/isUnbeaten', async () => {
      mockDb.getAllAsync.mockResolvedValue([teamRow]);

      const [team] = await sut.getAllTeams();

      expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM teams ORDER BY name ASC;');
      expect(team.countryId).toBe('br');
      expect(team.titles).toEqual(['1958', '1962']);
      expect(team.isUnbeaten).toBe(true);
      expect(team.winRate).toBeCloseTo(0.9); // computeWinRate(10) real
      expect(team.isFavorite).toBe(false);
    });

    it('countryId fica vazio quando não há flag_url', async () => {
      mockDb.getAllAsync.mockResolvedValue([{ ...teamRow, flag_url: null }]);

      const [team] = await sut.getAllTeams();

      expect(team.countryId).toBe('');
    });
  });

  describe('getFavoriteTeams', () => {
    it('retorna [] sem consultar o SQLite quando o usuário não tem favoritos', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

      const teams = await sut.getFavoriteTeams('user-1');

      expect(teams).toEqual([]);
      expect(mockDb.getAllAsync).not.toHaveBeenCalled();
    });

    it('busca os times favoritos e marca isFavorite: true', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => ({ favoriteTeamIds: ['t1'] }) });
      mockDb.getAllAsync.mockResolvedValue([teamRow]);

      const [team] = await sut.getFavoriteTeams('user-1');

      expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM teams WHERE id IN (?);', ['t1']);
      expect(team.isFavorite).toBe(true);
    });

    it('não deixa o erro do Firestore propagar — trata como sem favoritos', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (getDoc as jest.Mock).mockRejectedValue(new Error('offline'));

      const teams = await sut.getFavoriteTeams('user-1');

      expect(teams).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  describe('searchTeams', () => {
    it('busca por LIKE e marca isFavorite conforme os favoritos do usuário', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => ({ favoriteTeamIds: ['t1'] }) });
      mockDb.getAllAsync.mockResolvedValue([teamRow]);

      const [team] = await sut.searchTeams('user-1', 'bra');

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM teams WHERE name LIKE ? ORDER BY name ASC;',
        ['%bra%'],
      );
      expect(team.isFavorite).toBe(true);
    });

    it('sem userId, não consulta favoritos e isFavorite fica sempre false', async () => {
      mockDb.getAllAsync.mockResolvedValue([teamRow]);

      const [team] = await sut.searchTeams(undefined, 'bra');

      expect(getDoc).not.toHaveBeenCalled();
      expect(team.isFavorite).toBe(false);
    });
  });

  describe('toggleFavorite', () => {
    it('remove dos favoritos quando o time já é favorito', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => ({ favoriteTeamIds: ['t1'] }) });

      await sut.toggleFavorite('user-1', 't1');

      expect(arrayRemove).toHaveBeenCalledWith('t1');
      expect(updateDoc).toHaveBeenCalledWith('USER_DOC_REF', { favoriteTeamIds: { __op: 'arrayRemove', ids: ['t1'] } });
    });

    it('adiciona aos favoritos quando o time ainda não é favorito', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => ({ favoriteTeamIds: [] }) });

      await sut.toggleFavorite('user-1', 't1');

      expect(arrayUnion).toHaveBeenCalledWith('t1');
    });
  });

  describe('getById', () => {
    it('lança erro quando o time não existe', async () => {
      mockDb.getFirstAsync.mockResolvedValue(undefined);

      await expect(sut.getById('inexistente')).rejects.toThrow('Team not found: inexistente');
    });

    it('mapeia o time encontrado', async () => {
      mockDb.getFirstAsync.mockResolvedValue(teamRow);

      const team = await sut.getById('t1');

      expect(team.id).toBe('t1');
      expect(team.isFavorite).toBe(false);
    });
  });

  describe('getPlayersByTeam / getPlayerById', () => {
    const playerRow = {
      id: 'p1',
      name: 'Jogador X',
      team_id: 't1',
      position: 'ATA',
      type: 'titular',
      number: '#10',
      image_url: null,
    };

    it('getPlayersByTeam mapeia todos os jogadores do time', async () => {
      mockDb.getAllAsync.mockResolvedValue([playerRow]);

      const [player] = await sut.getPlayersByTeam('t1');

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM players WHERE team_id = ? ORDER BY name ASC;',
        ['t1'],
      );
      expect(player.number).toBe(10); // extrai dígitos de "#10"
      expect(player.stats).toEqual({ goals: 1, assists: 2, matchesPlayed: 3, worldCupsPlayed: 1 });
    });

    it('getPlayerById lança erro quando o jogador não existe', async () => {
      mockDb.getFirstAsync.mockResolvedValue(undefined);

      await expect(sut.getPlayerById('inexistente')).rejects.toThrow('Player not found: inexistente');
    });

    it('number cai para 10 quando não há número no row', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ ...playerRow, number: '' });

      const player = await sut.getPlayerById('p1');

      expect(player.number).toBe(10);
    });
  });
});
