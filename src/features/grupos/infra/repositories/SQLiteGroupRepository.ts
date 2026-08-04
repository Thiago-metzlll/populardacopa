import { Group, GroupStanding } from '../../domain/entities/Group';
import { GroupRepository } from '../../domain/repositories/GroupRepository';
import { getSQLiteDb } from '../../../../shared/infra/sqlite/database';

interface StandingRow {
  team_id: string;
  team_name: string | null;
  points: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
}

// LEFT JOIN: um standing sem time correspondente em `teams` continua aparecendo
// na classificação (cai no fallback para o team_id) em vez de sumir da tabela.
const STANDINGS_QUERY = `SELECT gs.*, t.name AS team_name
     FROM group_standings gs
     LEFT JOIN teams t ON t.id = gs.team_id
     WHERE gs.group_id = ?
     ORDER BY points DESC, goal_difference DESC, goals_for DESC;`;

export class SQLiteGroupRepository implements GroupRepository {
  private toStanding(row: StandingRow): GroupStanding {
    return {
      teamId: row.team_id,
      teamName: row.team_name ?? row.team_id,
      points: row.points,
      matchesPlayed: row.matches_played,
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
      goalsFor: row.goals_for,
      goalsAgainst: row.goals_against,
      goalDifference: row.goal_difference,
    };
  }

  private async getStandings(groupId: string): Promise<GroupStanding[]> {
    const sqliteDb = await getSQLiteDb();
    const rows = await sqliteDb.getAllAsync<StandingRow>(STANDINGS_QUERY, [groupId]);
    return rows.map((row) => this.toStanding(row));
  }

  async getAllGroups(): Promise<Group[]> {
    const sqliteDb = await getSQLiteDb();

    // 1. Busca todos os grupos
    const groupRows = await sqliteDb.getAllAsync<{ id: string; name: string }>(
      'SELECT * FROM groups ORDER BY id ASC;'
    );

    const groups: Group[] = [];

    // 2. Para cada grupo, busca seus standings (já com o nome do time) e monta a lista de ids
    for (const groupRow of groupRows) {
      const standings = await this.getStandings(groupRow.id);

      groups.push({
        id: groupRow.id,
        name: groupRow.name,
        teamIds: standings.map((s) => s.teamId),
        standings,
      });
    }

    return groups;
  }

  async getGroupById(id: string): Promise<Group> {
    const sqliteDb = await getSQLiteDb();

    const groupRow = await sqliteDb.getFirstAsync<{ id: string; name: string }>(
      'SELECT * FROM groups WHERE id = ?;',
      [id]
    );

    if (!groupRow) {
      throw new Error(`Group not found: ${id}`);
    }

    const standings = await this.getStandings(id);

    return {
      id: groupRow.id,
      name: groupRow.name,
      teamIds: standings.map((s) => s.teamId),
      standings,
    };
  }
}
