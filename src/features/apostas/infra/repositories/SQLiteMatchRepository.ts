import { Match, MatchOdds } from '../../domain/entities/Match';
import { MatchRepository } from '../../domain/repositories/MatchRepository';
import { getSQLiteDb } from '../../../../shared/infra/sqlite/database';

export class SQLiteMatchRepository implements MatchRepository {
  async getUpcomingMatches(): Promise<Match[]> {
    const sqliteDb = await getSQLiteDb();
    
    // Busca partidas com status SCHEDULED do banco local
    const rows = await sqliteDb.getAllAsync<{
      id: string;
      home_team_id: string;
      away_team_id: string;
      home_score: number;
      away_score: number;
      group_label: string | null;
      round_label: string | null;
      match_date: string;
      status: string;
    }>("SELECT * FROM matches WHERE LOWER(status) = 'scheduled' ORDER BY match_date ASC;");

    return rows.map((row) => this.mapRowToDomain(row));
  }

  async getMatchById(matchId: string): Promise<Match | null> {
    const sqliteDb = await getSQLiteDb();
    
    const row = await sqliteDb.getFirstAsync<{
      id: string;
      home_team_id: string;
      away_team_id: string;
      home_score: number;
      away_score: number;
      group_label: string | null;
      round_label: string | null;
      match_date: string;
      status: string;
    }>('SELECT * FROM matches WHERE id = ?;', [matchId]);

    if (!row) return null;

    return this.mapRowToDomain(row);
  }

  private mapRowToDomain(row: {
    id: string;
    home_team_id: string;
    away_team_id: string;
    home_score: number;
    away_score: number;
    group_label: string | null;
    round_label: string | null;
    match_date: string;
    status: string;
  }): Match {
    const statusLower = row.status.toLowerCase() as 'scheduled' | 'live' | 'finished';
    
    let odds: MatchOdds | undefined = undefined;
    if (statusLower === 'scheduled') {
      // Gera odds fictícias consistentes para testes
      const hash = row.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      odds = {
        homeWin: Number((1.5 + (hash % 10) * 0.2).toFixed(2)),
        draw: Number((2.8 + (hash % 5) * 0.15).toFixed(2)),
        awayWin: Number((2.0 + (hash % 8) * 0.25).toFixed(2)),
      };
    }

    return {
      id: row.id,
      homeTeamId: row.home_team_id,
      awayTeamId: row.away_team_id,
      homeScore: statusLower === 'finished' ? row.home_score : undefined,
      awayScore: statusLower === 'finished' ? row.away_score : undefined,
      date: row.match_date,
      phase: row.group_label || 'Fase de Grupos',
      status: statusLower,
      odds,
    };
  }
}
