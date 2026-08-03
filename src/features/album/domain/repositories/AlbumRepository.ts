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

/**
 * Resultado já decidido de uma compra, pronto para ser persistido.
 *
 * Quem decide *se* a compra pode acontecer, *quanto* sobra de saldo e *qual*
 * o novo progresso são os use cases (BuyStickerPack / BuyIndividualSticker).
 * Ao repositório cabe apenas gravar isto — de uma vez só, atomicamente.
 */
export interface StickerPurchaseCommit {
  userId: string;
  /** Saldo final já calculado pelo use case. */
  newBalance: number;
  /** Ids a acrescentar à coleção (sem repetição; podem já ser possuídos). */
  newStickerIds: string[];
  /** Progresso do álbum de referência já recalculado. */
  progress: number;
  /** Data ISO carimbada em cada figurinha adquirida. */
  obtainedAt: string;
}

export interface AlbumRepository {
  getUserCollection(userId: string): Promise<UserCollection>;
  getAlbumById(id: string): Promise<Album>;
  getStickersByIds(ids: string[]): Promise<Sticker[]>;
  openPackage(packageId: string, userId: string): Promise<Sticker[]>;
  getMarketAlbums(userId: string): Promise<Album[]>;
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
  /** Persiste uma compra já decidida pelo use case. Uma única escrita. */
  commitStickerPurchase(commit: StickerPurchaseCommit): Promise<void>;
}
