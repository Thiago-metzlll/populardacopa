import { Album } from '../entities/Album';
import { Sticker } from '../entities/Sticker';
import { UserCollection } from '../entities/UserCollection';

export interface BuyStickerPackResult {
  packId: string;
  stickers: Sticker[];
}

export interface AlbumRepository {
  getUserCollection(userId: string): Promise<UserCollection>;
  getAlbumById(id: string): Promise<Album>;
  getStickersByIds(ids: string[]): Promise<Sticker[]>;
  openPackage(packageId: string, userId: string): Promise<Sticker[]>;
  getMarketAlbums(): Promise<Album[]>;
  buyStickerPack(userId: string, albumId: string, cost: number): Promise<BuyStickerPackResult>;
  getUserCoins(userId: string): Promise<number>;
  deductUserCoins(userId: string, amount: number): Promise<number>;
}
