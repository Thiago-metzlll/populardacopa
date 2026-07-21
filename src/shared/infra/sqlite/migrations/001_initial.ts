import { type SQLiteDatabase } from 'expo-sqlite';
import { INITIAL_TEAMS, AVAILABLE_PLAYERS, INITIAL_MATCHES } from '../../../../../database';
import { mockAlbums, mockStickers } from '../../../../features/album/infra/seed/AlbumSeed';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  // Verificamos se o banco já foi inicializado
  const userVersionResult = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = userVersionResult?.user_version ?? 0;

  if (currentVersion >= 1) {
    return;
  }

  await db.withTransactionAsync(async () => {
    // 1. Criação das tabelas
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        group_key TEXT,
        flag_url TEXT,
        subtitle TEXT,
        ranking INTEGER DEFAULT 0,
        world_cup_wins INTEGER DEFAULT 0,
        description TEXT DEFAULT '',
        is_unbeaten INTEGER DEFAULT 0,
        titles TEXT DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        team_id TEXT NOT NULL,
        position TEXT NOT NULL,
        type TEXT NOT NULL,
        number TEXT,
        image_url TEXT,
        FOREIGN KEY (team_id) REFERENCES teams(id)
      );

      CREATE TABLE IF NOT EXISTS albums (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        total_stickers INTEGER NOT NULL,
        price INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS stickers (
        id TEXT PRIMARY KEY,
        album_id TEXT NOT NULL,
        player_id TEXT,
        team_id TEXT,
        player_name TEXT NOT NULL,
        price INTEGER NOT NULL,
        rarity TEXT NOT NULL,
        image_url TEXT,
        FOREIGN KEY (album_id) REFERENCES albums(id)
      );

      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS group_standings (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        team_id TEXT NOT NULL,
        points INTEGER DEFAULT 0,
        matches_played INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        draws INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        goals_for INTEGER DEFAULT 0,
        goals_against INTEGER DEFAULT 0,
        goal_difference INTEGER DEFAULT 0,
        FOREIGN KEY (group_id) REFERENCES groups(id),
        FOREIGN KEY (team_id) REFERENCES teams(id)
      );

      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        home_team_id TEXT NOT NULL,
        away_team_id TEXT NOT NULL,
        home_score INTEGER DEFAULT 0,
        away_score INTEGER DEFAULT 0,
        group_label TEXT,
        round_label TEXT,
        match_date TEXT NOT NULL,
        status TEXT NOT NULL
      );
    `);

    // 2. Inserção de Teams
    for (const team of INITIAL_TEAMS) {
      await db.runAsync(
        `INSERT OR IGNORE INTO teams (id, name, group_key, flag_url, subtitle, ranking, world_cup_wins, description, is_unbeaten, titles)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          team.id,
          team.name,
          team.group,
          team.flagUrl,
          team.subtitle || null,
          team.ranking ?? 0,
          team.worldCupWins ?? 0,
          team.description ?? '',
          team.isUnbeaten ? 1 : 0,
          JSON.stringify(team.titles || []),
        ]
      );
    }

    // 3. Inserção de Players
    for (const player of AVAILABLE_PLAYERS) {
      await db.runAsync(
        `INSERT OR IGNORE INTO players (id, name, team_id, position, type, number, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          player.id,
          player.name,
          player.teamId,
          player.position,
          player.type,
          player.number,
          player.imageUrl || null,
        ]
      );
    }

    // 4. Inserção de Albums
    for (const album of mockAlbums) {
      await db.runAsync(
        `INSERT OR IGNORE INTO albums (id, name, total_stickers, price)
         VALUES (?, ?, ?, ?)`,
        [album.id, album.name, album.totalStickers, album.price ?? 0]
      );
    }

    // 5. Inserção de Stickers (Catálogo)
    for (const sticker of mockStickers) {
      await db.runAsync(
        `INSERT OR IGNORE INTO stickers (id, album_id, player_id, team_id, player_name, price, rarity, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sticker.id,
          sticker.albumId,
          sticker.playerId || null,
          sticker.teamId || null,
          sticker.playerName,
          sticker.price,
          sticker.rarity,
          sticker.imageUrl,
        ]
      );
    }

    // 6. Inserção de Matches (Fase de Grupos)
    for (const match of INITIAL_MATCHES) {
      await db.runAsync(
        `INSERT OR IGNORE INTO matches (id, home_team_id, away_team_id, home_score, away_score, group_label, round_label, match_date, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          match.id,
          match.homeTeamId,
          match.awayTeamId,
          match.homeScore,
          match.awayScore,
          match.group,
          match.round,
          match.date,
          match.status,
        ]
      );
    }

    // Adiciona algumas partidas mock adicionais para apostas (MatchSeed.ts de teste)
    // m1, m2, m3, m4 (SCHEDULED) e m9 (FINISHED, Brasil vs Espanha)
    const testMatches = [
      { id: 'm1', homeTeamId: 't1', awayTeamId: 't2', homeScore: 0, awayScore: 0, group_label: 'Fase de Grupos', round_label: 'RODADA de Teste 1', match_date: new Date(Date.now() + 86400000 * 2).toISOString(), status: 'SCHEDULED' },
      { id: 'm2', homeTeamId: 't1', awayTeamId: 't10', homeScore: 0, awayScore: 0, group_label: 'Fase de Grupos', round_label: 'RODADA de Teste 2', match_date: new Date(Date.now() + 86400000 * 5).toISOString(), status: 'SCHEDULED' },
      { id: 'm3', homeTeamId: 't3', awayTeamId: 't4', homeScore: 0, awayScore: 0, group_label: 'Fase de Grupos', round_label: 'RODADA de Teste 3', match_date: new Date(Date.now() + 86400000 * 3).toISOString(), status: 'SCHEDULED' },
      { id: 'm4', homeTeamId: 't5', awayTeamId: 't8', homeScore: 0, awayScore: 0, group_label: 'Fase de Grupos', round_label: 'RODADA de Teste 4', match_date: new Date(Date.now() + 86400000 * 4).toISOString(), status: 'SCHEDULED' },
      { id: 'm9', homeTeamId: 't1', awayTeamId: 't5', homeScore: 2, awayScore: 1, group_label: 'Fase de Grupos', round_label: 'RODADA de Teste Finalizada', match_date: new Date(Date.now() - 86400000).toISOString(), status: 'FINISHED' }
    ];

    for (const match of testMatches) {
      await db.runAsync(
        `INSERT OR IGNORE INTO matches (id, home_team_id, away_team_id, home_score, away_score, group_label, round_label, match_date, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          match.id,
          match.homeTeamId,
          match.awayTeamId,
          match.homeScore,
          match.awayScore,
          match.group_label,
          match.round_label,
          match.match_date,
          match.status,
        ]
      );
    }

    // 7. Popula a tabela 'groups' extraindo as chaves únicas
    const groupsKeys = Array.from(new Set(INITIAL_TEAMS.map((t) => t.group))).sort();
    for (const key of groupsKeys) {
      await db.runAsync(
        `INSERT OR IGNORE INTO groups (id, name) VALUES (?, ?)`,
        [key, `Grupo ${key}`]
      );
    }

    // 8. Cálculo e preenchimento dos Standings para cada grupo
    // Inicializa a tabela group_standings para cada time com tudo zerado
    for (const team of INITIAL_TEAMS) {
      await db.runAsync(
        `INSERT OR IGNORE INTO group_standings (id, group_id, team_id, points, matches_played, wins, draws, losses, goals_for, goals_against, goal_difference)
         VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0)`,
        [`gs_${team.id}`, team.group, team.id]
      );
    }

    // Processa cada partida finalizada da fase de grupos para acumular os pontos
    for (const match of INITIAL_MATCHES) {
      if (match.status !== 'FINISHED') continue;

      const homeId = match.homeTeamId;
      const awayId = match.awayTeamId;
      const hScore = match.homeScore;
      const aScore = match.awayScore;

      let homePoints = 0;
      let awayPoints = 0;
      let homeWin = 0, homeDraw = 0, homeLoss = 0;
      let awayWin = 0, awayDraw = 0, awayLoss = 0;

      if (hScore > aScore) {
        homePoints = 3;
        homeWin = 1;
        awayLoss = 1;
      } else if (hScore < aScore) {
        awayPoints = 3;
        awayWin = 1;
        homeLoss = 1;
      } else {
        homePoints = 1;
        awayPoints = 1;
        homeDraw = 1;
        awayDraw = 1;
      }

      // Atualiza Home Team
      await db.runAsync(
        `UPDATE group_standings 
         SET points = points + ?,
             matches_played = matches_played + 1,
             wins = wins + ?,
             draws = draws + ?,
             losses = losses + ?,
             goals_for = goals_for + ?,
             goals_against = goals_against + ?,
             goal_difference = goal_difference + ?
         WHERE team_id = ?`,
        [homePoints, homeWin, homeDraw, homeLoss, hScore, aScore, hScore - aScore, homeId]
      );

      // Atualiza Away Team
      await db.runAsync(
        `UPDATE group_standings 
         SET points = points + ?,
             matches_played = matches_played + 1,
             wins = wins + ?,
             draws = draws + ?,
             losses = losses + ?,
             goals_for = goals_for + ?,
             goals_against = goals_against + ?,
             goal_difference = goal_difference + ?
         WHERE team_id = ?`,
        [awayPoints, awayWin, awayDraw, awayLoss, aScore, hScore, aScore - hScore, awayId]
      );
    }

    // Atualiza a versão do banco
    await db.execAsync('PRAGMA user_version = 1;');
  });
}
