import { Album } from '../../domain/entities/Album';
import { Sticker } from '../../domain/entities/Sticker';
import { getSQLiteDb } from '../../../../shared/infra/sqlite/database';

export class SQLiteAlbumCatalogRepository {
  async getAlbumById(id: string): Promise<Album> {
    const sqliteDb = await getSQLiteDb();
    const row = await sqliteDb.getFirstAsync<{
      id: string;
      name: string;
      total_stickers: number;
      price: number;
    }>('SELECT * FROM albums WHERE id = ?;', [id]);

    if (!row) {
      throw new Error(`Album not found: ${id}`);
    }

    return {
      id: row.id,
      name: row.name,
      totalStickers: row.total_stickers,
      ownedStickersCount: 0,
      price: row.price,
    };
  }

  async getMarketAlbums(): Promise<Album[]> {
    const sqliteDb = await getSQLiteDb();
    const rows = await sqliteDb.getAllAsync<{
      id: string;
      name: string;
      total_stickers: number;
      price: number;
    }>('SELECT * FROM albums ORDER BY id ASC;');

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      totalStickers: row.total_stickers,
      ownedStickersCount: 0,
      price: row.price,
    }));
  }

  async getStickersByIds(ids: string[]): Promise<Sticker[]> {
    if (ids.length === 0) return [];
    
    const sqliteDb = await getSQLiteDb();
    const placeholders = ids.map(() => '?').join(',');
    const rows = await sqliteDb.getAllAsync<{
      id: string;
      album_id: string;
      player_id: string | null;
      team_id: string | null;
      player_name: string;
      price: number;
      rarity: string;
      image_url: string;
    }>(`SELECT * FROM stickers WHERE id IN (${placeholders});`, ids);

    return rows.map((row) => this.mapRowToSticker(row));
  }

  async getStickersByAlbumId(albumId: string): Promise<Sticker[]> {
    const sqliteDb = await getSQLiteDb();
    const rows = await sqliteDb.getAllAsync<{
      id: string;
      album_id: string;
      player_id: string | null;
      team_id: string | null;
      player_name: string;
      price: number;
      rarity: string;
      image_url: string;
    }>('SELECT * FROM stickers WHERE album_id = ? ORDER BY id ASC;', [albumId]);

    return rows.map((row) => this.mapRowToSticker(row));
  }

  async getAllStickers(): Promise<Sticker[]> {
    const sqliteDb = await getSQLiteDb();
    const rows = await sqliteDb.getAllAsync<{
      id: string;
      album_id: string;
      player_id: string | null;
      team_id: string | null;
      player_name: string;
      price: number;
      rarity: string;
      image_url: string;
    }>('SELECT * FROM stickers ORDER BY id ASC;');

    return rows.map((row) => this.mapRowToSticker(row));
  }

  private mapRowToSticker(row: {
    id: string;
    album_id: string;
    player_id: string | null;
    team_id: string | null;
    player_name: string;
    price: number;
    rarity: string;
    image_url: string;
  }): Sticker {
    return {
      id: row.id,
      albumId: row.album_id,
      playerId: row.player_id || undefined,
      teamId: row.team_id || undefined,
      playerName: row.player_name,
      price: row.price,
      rarity: row.rarity as 'comum' | 'rara' | 'lendaria',
      imageUrl: row.image_url,
      obtainedAt: '',
    };
  }
}
