jest.mock('../../../../../shared/infra/sqlite/database', () => ({
  getSQLiteDb: jest.fn(),
}));

import { getSQLiteDb } from '../../../../../shared/infra/sqlite/database';
import { SQLiteGroupRepository } from '../../../infra/repositories/SQLiteGroupRepository';

const mockDb = {
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
};

const standingRow = {
  team_id: 't1',
  points: 6,
  matches_played: 2,
  wins: 2,
  draws: 0,
  losses: 0,
  goals_for: 4,
  goals_against: 1,
  goal_difference: 3,
};

beforeEach(() => {
  jest.clearAllMocks();
  (getSQLiteDb as jest.Mock).mockResolvedValue(mockDb);
});

describe('SQLiteGroupRepository', () => {
  const sut = new SQLiteGroupRepository();

  describe('getAllGroups', () => {
    it('busca os grupos e, para cada um, os standings ordenados por critério de desempate', async () => {
      mockDb.getAllAsync
        .mockResolvedValueOnce([{ id: 'A', name: 'Grupo A' }])
        .mockResolvedValueOnce([standingRow]);

      const [group] = await sut.getAllGroups();

      expect(mockDb.getAllAsync).toHaveBeenNthCalledWith(1, 'SELECT * FROM groups ORDER BY id ASC;');
      expect(mockDb.getAllAsync).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('ORDER BY points DESC, goal_difference DESC, goals_for DESC'),
        ['A'],
      );
      expect(group.id).toBe('A');
      expect(group.teamIds).toEqual(['t1']);
      expect(group.standings[0]).toEqual({
        teamId: 't1',
        points: 6,
        matchesPlayed: 2,
        wins: 2,
        draws: 0,
        losses: 0,
        goalsFor: 4,
        goalsAgainst: 1,
        goalDifference: 3,
      });
    });

    it('deriva teamIds a partir dos standings de cada grupo', async () => {
      mockDb.getAllAsync
        .mockResolvedValueOnce([
          { id: 'A', name: 'Grupo A' },
          { id: 'B', name: 'Grupo B' },
        ])
        .mockResolvedValueOnce([standingRow])
        .mockResolvedValueOnce([{ ...standingRow, team_id: 't2' }]);

      const groups = await sut.getAllGroups();

      expect(groups).toHaveLength(2);
      expect(groups[0].teamIds).toEqual(['t1']);
      expect(groups[1].teamIds).toEqual(['t2']);
    });
  });

  describe('getGroupById', () => {
    it('lança erro quando o grupo não existe', async () => {
      mockDb.getFirstAsync.mockResolvedValue(undefined);

      await expect(sut.getGroupById('Z')).rejects.toThrow('Group not found: Z');
    });

    it('mapeia o grupo e seus standings quando encontrado', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ id: 'A', name: 'Grupo A' });
      mockDb.getAllAsync.mockResolvedValue([standingRow]);

      const group = await sut.getGroupById('A');

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith('SELECT * FROM groups WHERE id = ?;', ['A']);
      expect(group.standings).toHaveLength(1);
      expect(group.teamIds).toEqual(['t1']);
    });
  });
});
