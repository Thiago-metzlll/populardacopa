import { Album } from '../entities/Album';
import { Sticker } from '../entities/Sticker';
import { UserCollection } from '../entities/UserCollection';
import { DailyCoinsStatus, DailyClaimStatus } from '../constants/rewards';

export interface BuyStickerPackResult {
  packId: string;
  stickers: Sticker[];
}

export interface ClaimDailyCoinsResult {
  coins: number;
  amount: number;
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
  addUserCoins(userId: string, amount: number): Promise<number>;
  getDailyCoinsStatus(userId: string): Promise<DailyCoinsStatus>;
  claimDailyCoins(userId: string): Promise<ClaimDailyCoinsResult>;
  getFreePackStatus(userId: string): Promise<DailyClaimStatus>;
  claimFreePackage(userId: string): Promise<Sticker[]>;
  grantStickers(userId: string, stickerIds: string[]): Promise<Sticker[]>;
  getStickersByAlbumId(albumId: string): Promise<Sticker[]>;
  getAllStickers(): Promise<Sticker[]>;
  buyIndividualSticker(userId: string, stickerId: string, cost: number): Promise<Sticker>;
}
