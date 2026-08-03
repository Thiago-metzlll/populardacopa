jest.mock('../../../../../shared/infra/sqlite/database', () => ({
  getSQLiteDb: jest.fn(),
}));

jest.mock('../../../domain/constants/odds', () => ({
  computeMatchOdds: jest.fn(() => ({ homeWin: 1.5, draw: 2.8, awayWin: 2.0 })),
}));

import { getSQLiteDb } from '../../../../../shared/infra/sqlite/database';
import { computeMatchOdds } from '../../../domain/constants/odds';
import { SQLiteMatchRepository } from '../../../infra/repositories/SQLiteMatchRepository';

const mockDb = {
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
};

const baseRow = {
  id: 'm1',
  home_team_id: 'a',
  away_team_id: 'b',
  home_score: 2,
  away_score: 1,
  group_label: 'Grupo A',
  round_label: null,
  match_date: '2026-07-01T00:00:00.000Z',
  status: 'SCHEDULED',
};

beforeEach(() => {
  jest.clearAllMocks();
  (getSQLiteDb as jest.Mock).mockResolvedValue(mockDb);
});

describe('SQLiteMatchRepository', () => {
  const sut = new SQLiteMatchRepository();

  describe('getUpcomingMatches', () => {
    it('consulta só partidas agendadas, ordenadas por data', async () => {
      mockDb.getAllAsync.mockResolvedValue([baseRow]);

      await sut.getUpcomingMatches();

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        "SELECT * FROM matches WHERE LOWER(status) = 'scheduled' ORDER BY match_date ASC;",
      );
    });
  });

  describe('getMatchById', () => {
    it('retorna null quando a partida não existe', async () => {
      mockDb.getFirstAsync.mockResolvedValue(undefined);

      const match = await sut.getMatchById('inexistente');

      expect(match).toBeNull();
    });

    it('partida agendada: gera odds e não expõe placar', async () => {
      mockDb.getFirstAsync.mockResolvedValue(baseRow);

      const match = await sut.getMatchById('m1');

      expect(computeMatchOdds).toHaveBeenCalledWith('m1');
      expect(match!.odds).toEqual({ homeWin: 1.5, draw: 2.8, awayWin: 2.0 });
      expect(match!.homeScore).toBeUndefined();
      expect(match!.awayScore).toBeUndefined();
      expect(match!.status).toBe('scheduled');
    });

    it('partida finalizada: expõe o placar e não gera odds', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ ...baseRow, status: 'FINISHED' });

      const match = await sut.getMatchById('m1');

      expect(computeMatchOdds).not.toHaveBeenCalled();
      expect(match!.odds).toBeUndefined();
      expect(match!.homeScore).toBe(2);
      expect(match!.awayScore).toBe(1);
    });

    it('partida ao vivo: sem odds e sem placar', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ ...baseRow, status: 'LIVE' });

      const match = await sut.getMatchById('m1');

      expect(match!.odds).toBeUndefined();
      expect(match!.homeScore).toBeUndefined();
      expect(match!.awayScore).toBeUndefined();
    });

    it('usa "Fase de Grupos" como fallback quando não há group_label', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ ...baseRow, group_label: null });

      const match = await sut.getMatchById('m1');

      expect(match!.phase).toBe('Fase de Grupos');
    });
  });
});
