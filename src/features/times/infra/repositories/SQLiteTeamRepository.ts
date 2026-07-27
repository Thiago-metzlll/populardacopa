import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../../../shared/infra/firebase/firebaseConfig';
import { COLLECTIONS, USER_FIELDS } from '../../../../shared/infra/firebase/collections';
import { Team } from '../../domain/entities/Team';
import { Player } from '../../domain/entities/Player';
import { TeamRepository } from '../../domain/repositories/TeamRepository';
import { getSQLiteDb } from '../../../../shared/infra/sqlite/database';

const getCountryIdFromFlagUrl = (flagUrl: string | null | undefined): string => {
  if (!flagUrl) return '';
  const parts = flagUrl.split('/');
  const filename = parts[parts.length - 1];
  return filename.replace('.png', '');
};

export class SQLiteTeamRepository implements TeamRepository {
  private async getFavoriteIds(userId: string): Promise<string[]> {
    try {
      const ref = doc(db, COLLECTIONS.USERS, userId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return snap.data()[USER_FIELDS.FAVORITE_TEAM_IDS] ?? [];
      }
    } catch (error) {
      console.error('Error fetching favorites from Firestore:', error);
    }
    return [];
  }

  async getAllTeams(): Promise<Team[]> {
    const sqliteDb = await getSQLiteDb();
    const rows = await sqliteDb.getAllAsync<{
      id: string;
      name: string;
      group_key: string;
      flag_url: string;
      subtitle: string | null;
      ranking: number;
      world_cup_wins: number;
      description: string;
      is_unbeaten: number;
      titles: string;
    }>('SELECT * FROM teams ORDER BY name ASC;');

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      countryId: getCountryIdFromFlagUrl(row.flag_url),
      groupId: row.group_key,
      ranking: row.ranking,
      winRate: row.ranking > 0 ? Math.max(0.3, 1 - row.ranking / 100) : 0.5, // pseudo-calculado
      isFavorite: false, // preenchido sob demanda na presentation/usecase
      titles: JSON.parse(row.titles || '[]'),
      worldCupWins: row.world_cup_wins,
      description: row.description,
      isUnbeaten: row.is_unbeaten === 1,
    }));
  }

  async getFavoriteTeams(userId: string): Promise<Team[]> {
    const favoriteIds = await this.getFavoriteIds(userId);
    if (favoriteIds.length === 0) return [];

    const sqliteDb = await getSQLiteDb();
    // Monta a query IN de forma segura
    const placeholders = favoriteIds.map(() => '?').join(',');
    const rows = await sqliteDb.getAllAsync<{
      id: string;
      name: string;
      group_key: string;
      flag_url: string;
      subtitle: string | null;
      ranking: number;
      world_cup_wins: number;
      description: string;
      is_unbeaten: number;
      titles: string;
    }>(`SELECT * FROM teams WHERE id IN (${placeholders});`, favoriteIds);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      countryId: getCountryIdFromFlagUrl(row.flag_url),
      groupId: row.group_key,
      ranking: row.ranking,
      winRate: row.ranking > 0 ? Math.max(0.3, 1 - row.ranking / 100) : 0.5,
      isFavorite: true,
      titles: JSON.parse(row.titles || '[]'),
      worldCupWins: row.world_cup_wins,
      description: row.description,
      isUnbeaten: row.is_unbeaten === 1,
    }));
  }

  async searchTeams(userId: string | undefined, query: string): Promise<Team[]> {
    const sqliteDb = await getSQLiteDb();
    const rows = await sqliteDb.getAllAsync<{
      id: string;
      name: string;
      group_key: string;
      flag_url: string;
      subtitle: string | null;
      ranking: number;
      world_cup_wins: number;
      description: string;
      is_unbeaten: number;
      titles: string;
    }>('SELECT * FROM teams WHERE name LIKE ? ORDER BY name ASC;', [`%${query}%`]);

    const favoriteIds = userId ? await this.getFavoriteIds(userId) : [];

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      countryId: getCountryIdFromFlagUrl(row.flag_url),
      groupId: row.group_key,
      ranking: row.ranking,
      winRate: row.ranking > 0 ? Math.max(0.3, 1 - row.ranking / 100) : 0.5,
      isFavorite: favoriteIds.includes(row.id),
      titles: JSON.parse(row.titles || '[]'),
      worldCupWins: row.world_cup_wins,
      description: row.description,
      isUnbeaten: row.is_unbeaten === 1,
    }));
  }

  async toggleFavorite(userId: string, teamId: string): Promise<void> {
    const ref = doc(db, COLLECTIONS.USERS, userId);
    const favoriteIds = await this.getFavoriteIds(userId);
    const isFav = favoriteIds.includes(teamId);

    if (isFav) {
      await updateDoc(ref, {
        [USER_FIELDS.FAVORITE_TEAM_IDS]: arrayRemove(teamId),
      });
    } else {
      await updateDoc(ref, {
        [USER_FIELDS.FAVORITE_TEAM_IDS]: arrayUnion(teamId),
      });
    }
  }

  async getById(teamId: string): Promise<Team> {
    const sqliteDb = await getSQLiteDb();
    const row = await sqliteDb.getFirstAsync<{
      id: string;
      name: string;
      group_key: string;
      flag_url: string;
      subtitle: string | null;
      ranking: number;
      world_cup_wins: number;
      description: string;
      is_unbeaten: number;
      titles: string;
    }>('SELECT * FROM teams WHERE id = ?;', [teamId]);

    if (!row) {
      throw new Error(`Team not found: ${teamId}`);
    }

    return {
      id: row.id,
      name: row.name,
      countryId: getCountryIdFromFlagUrl(row.flag_url),
      groupId: row.group_key,
      ranking: row.ranking,
      winRate: row.ranking > 0 ? Math.max(0.3, 1 - row.ranking / 100) : 0.5,
      isFavorite: false, // Será atualizado se o contexto do usuário tiver logado
      titles: JSON.parse(row.titles || '[]'),
      worldCupWins: row.world_cup_wins,
      description: row.description,
      isUnbeaten: row.is_unbeaten === 1,
    };
  }

  async getPlayersByTeam(teamId: string): Promise<Player[]> {
    const sqliteDb = await getSQLiteDb();
    const rows = await sqliteDb.getAllAsync<{
      id: string;
      name: string;
      team_id: string;
      position: string;
      type: string;
      number: string;
      image_url: string | null;
    }>('SELECT * FROM players WHERE team_id = ? ORDER BY name ASC;', [teamId]);

    return rows.map((row) => this.mapPlayerRowToDomain(row));
  }

  async getPlayerById(playerId: string): Promise<Player> {
    const sqliteDb = await getSQLiteDb();
    const row = await sqliteDb.getFirstAsync<{
      id: string;
      name: string;
      team_id: string;
      position: string;
      type: string;
      number: string;
      image_url: string | null;
    }>('SELECT * FROM players WHERE id = ?;', [playerId]);

    if (!row) {
      throw new Error(`Player not found: ${playerId}`);
    }

    return this.mapPlayerRowToDomain(row);
  }

  private mapPlayerRowToDomain(row: {
    id: string;
    name: string;
    team_id: string;
    position: string;
    type: string;
    number: string;
    image_url: string | null;
  }): Player {
    // Calcula estatísticas fictícias de forma a parecerem ricas na interface
    let goals = 0;
    let assists = 0;
    const matchesPlayed = Math.floor(Math.random() * 4) + 3; // 3 a 7 jogos na copa
    const worldCupsPlayed = Math.floor(Math.random() * 2) + 1; // 1 ou 2 copas

    if (row.position === 'ATA') {
      goals = Math.floor(Math.random() * 3) + 1;
      assists = Math.floor(Math.random() * 2);
    } else if (row.position === 'MEI') {
      goals = Math.floor(Math.random() * 2);
      assists = Math.floor(Math.random() * 3) + 1;
    } else if (row.position === 'DEF') {
      goals = Math.random() > 0.8 ? 1 : 0;
      assists = Math.floor(Math.random() * 2);
    }

    return {
      id: row.id,
      name: row.name,
      number: row.number ? (Number(row.number.replace(/[^0-9]/g, '')) || 10) : 10,
      position: row.position,
      teamId: row.team_id,
      photoUrl: row.image_url || undefined,
      awards: row.position === 'SPECIAL' ? ['MVP'] : undefined,
      worldCupHistory: [
        {
          edition: 'Copa 2026',
          team: row.team_id.toUpperCase(),
          result: 'Fase de Grupos',
        },
      ],
      stats: {
        goals,
        assists,
        matchesPlayed,
        worldCupsPlayed,
      },
    };
  }
}
