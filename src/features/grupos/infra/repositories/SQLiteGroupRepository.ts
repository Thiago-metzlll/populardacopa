import { Group, GroupStanding } from '../../domain/entities/Group';
import { GroupRepository } from '../../domain/repositories/GroupRepository';
import { getSQLiteDb } from '../../../../shared/infra/sqlite/database';

export class SQLiteGroupRepository implements GroupRepository {
  async getAllGroups(): Promise<Group[]> {
    const sqliteDb = await getSQLiteDb();
    
    // 1. Busca todos os grupos
    const groupRows = await sqliteDb.getAllAsync<{ id: string; name: string }>(
      'SELECT * FROM groups ORDER BY id ASC;'
    );

    const groups: Group[] = [];

    // 2. Para cada grupo, busca seus standings e monta a lista de times
    for (const groupRow of groupRows) {
      const standingsRows = await sqliteDb.getAllAsync<{
        team_id: string;
        points: number;
        matches_played: number;
        wins: number;
        draws: number;
        losses: number;
        goals_for: number;
        goals_against: number;
        goal_difference: number;
      }>(
        `SELECT * FROM group_standings 
         WHERE group_id = ? 
         ORDER BY points DESC, goal_difference DESC, goals_for DESC;`,
        [groupRow.id]
      );

      const standings: GroupStanding[] = standingsRows.map((row) => ({
        teamId: row.team_id,
        points: row.points,
        matchesPlayed: row.matches_played,
        wins: row.wins,
        draws: row.draws,
        losses: row.losses,
        goalsFor: row.goals_for,
        goalsAgainst: row.goals_against,
        goalDifference: row.goal_difference,
      }));

      const teamIds = standings.map((s) => s.teamId);

      groups.push({
        id: groupRow.id,
        name: groupRow.name,
        teamIds,
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

    const standingsRows = await sqliteDb.getAllAsync<{
      team_id: string;
      points: number;
      matches_played: number;
      wins: number;
      draws: number;
      losses: number;
      goals_for: number;
      goals_against: number;
      goal_difference: number;
    }>(
      `SELECT * FROM group_standings 
       WHERE group_id = ? 
       ORDER BY points DESC, goal_difference DESC, goals_for DESC;`,
      [id]
    );

    const standings: GroupStanding[] = standingsRows.map((row) => ({
      teamId: row.team_id,
      points: row.points,
      matchesPlayed: row.matches_played,
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
      goalsFor: row.goals_for,
      goalsAgainst: row.goals_against,
      goalDifference: row.goal_difference,
    }));

    const teamIds = standings.map((s) => s.teamId);

    return {
      id: groupRow.id,
      name: groupRow.name,
      teamIds,
      standings,
    };
  }
}
