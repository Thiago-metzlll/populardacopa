import { Album } from '../../domain/entities/Album';
import { Sticker } from '../../domain/entities/Sticker';
import { UserCollection } from '../../domain/entities/UserCollection';
import { AlbumRepository, BuyStickerPackResult, ClaimDailyCoinsResult } from '../../domain/repositories/AlbumRepository';
import { computeDailyCoinsStatus, computeFreePackStatus, DailyCoinsStatus, DailyClaimStatus } from '../../domain/constants/rewards';
import { mockAlbums, mockStickers, mockUserCollection } from '../seed/AlbumSeed';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export class MockAlbumRepository implements AlbumRepository {
  private collectionState = { ...mockUserCollection, stickerIds: [...mockUserCollection.stickerIds] };
  private coinsState: Record<string, number> = { u1: 200 };
  private packsState: Record<string, Sticker[]> = {};
  private dailyClaimState: Record<string, string | null> = {};
  private freePackClaimState: Record<string, string | null> = {};

  async getUserCollection(userId: string): Promise<UserCollection> {
    await delay(350);
    if (userId !== this.collectionState.userId) {
      throw new Error('User collection not found');
    }
    return this.collectionState;
  }

  async getAlbumById(id: string): Promise<Album> {
    await delay(300);
    const album = mockAlbums.find((a) => a.id === id);
    if (!album) throw new Error('Album not found');
    return { ...album, ownedStickersCount: this.collectionState.stickerIds.length };
  }

  async getStickersByIds(ids: string[]): Promise<Sticker[]> {
    await delay(300);
    return mockStickers.filter((s) => ids.includes(s.id));
  }

  private async drawAndGrantStickers(): Promise<Sticker[]> {
    const notOwnedStickers = mockStickers.filter(
      (s) => !this.collectionState.stickerIds.includes(s.id)
    );

    const newStickers: Sticker[] = [];
    const numToDraw = Math.min(3, notOwnedStickers.length);
    const shuffled = [...notOwnedStickers].sort(() => 0.5 - Math.random());

    for (let i = 0; i < numToDraw; i++) {
      const sticker = shuffled[i];
      const updatedSticker = { ...sticker, obtainedAt: new Date().toISOString() };
      newStickers.push(updatedSticker);

      const index = mockStickers.findIndex(s => s.id === sticker.id);
      if (index !== -1) mockStickers[index] = updatedSticker;
    }

    const newStickerIds = newStickers.map(s => s.id);
    this.collectionState.stickerIds = [...this.collectionState.stickerIds, ...newStickerIds];
    this.collectionState.progress = (this.collectionState.stickerIds.length / mockAlbums[0].totalStickers) * 100;

    return newStickers;
  }

  async openPackage(packageId: string, userId: string): Promise<Sticker[]> {
    await delay(500);
    return this.drawAndGrantStickers();
  }

  async getFreePackStatus(userId: string): Promise<DailyClaimStatus> {
    await delay(150);
    return computeFreePackStatus(this.freePackClaimState[userId] ?? null);
  }

  async claimFreePackage(userId: string): Promise<Sticker[]> {
    await delay(500);
    const status = await this.getFreePackStatus(userId);
    if (!status.available) {
      throw new Error('Pacote grátis ainda não disponível.');
    }
    this.freePackClaimState[userId] = new Date().toISOString();
    return this.drawAndGrantStickers();
  }

  async grantStickers(userId: string, stickerIds: string[]): Promise<Sticker[]> {
    await delay(300);
    const newIds = stickerIds.filter((id) => !this.collectionState.stickerIds.includes(id));
    const granted = mockStickers
      .filter((s) => newIds.includes(s.id))
      .map((s) => ({ ...s, obtainedAt: new Date().toISOString() }));

    if (granted.length > 0) {
      this.collectionState.stickerIds = [...this.collectionState.stickerIds, ...newIds];
      this.collectionState.progress = (this.collectionState.stickerIds.length / mockAlbums[0].totalStickers) * 100;
    }

    return granted;
  }

  async getMarketAlbums(): Promise<Album[]> {
    await delay(300);
    return mockAlbums.map((a) => ({
      ...a,
      ownedStickersCount: a.id === 'a1' ? this.collectionState.stickerIds.length : 15
    }));
  }

  async buyStickerPack(userId: string, albumId: string, cost: number): Promise<BuyStickerPackResult> {
    await delay(600);
    
    const userCoins = this.coinsState[userId] ?? 200;
    if (userCoins < cost) {
      throw new Error('Saldo de moedas insuficiente');
    }

    // Deduct coins
    this.coinsState[userId] = userCoins - cost;

    // Draw 3 random stickers
    // Filter stickers corresponding to the team ranges or general mockStickers
    const albumStickers = mockStickers;
    const drawn: Sticker[] = [];
    
    // Choose 3 random stickers
    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * albumStickers.length);
      const sticker = albumStickers[randomIndex];
      const updatedSticker = { ...sticker, obtainedAt: new Date().toISOString() };
      drawn.push(updatedSticker);

      // Add to collection if not already owned
      if (!this.collectionState.stickerIds.includes(sticker.id)) {
        this.collectionState.stickerIds.push(sticker.id);
      }
    }

    // Update collection progress
    this.collectionState.progress = (this.collectionState.stickerIds.length / mockAlbums[0].totalStickers) * 100;

    const packId = `pkg_${Date.now()}`;
    this.packsState[packId] = drawn;

    return {
      packId,
      stickers: drawn
    };
  }

  async getUserCoins(userId: string): Promise<number> {
    await delay(200);
    return this.coinsState[userId] ?? 200;
  }

  async deductUserCoins(userId: string, amount: number): Promise<number> {
    await delay(200);
    const userCoins = this.coinsState[userId] ?? 200;
    const newBalance = Math.max(0, userCoins - amount);
    this.coinsState[userId] = newBalance;
    return newBalance;
  }

  async addUserCoins(userId: string, amount: number): Promise<number> {
    await delay(200);
    const newBalance = (this.coinsState[userId] ?? 200) + amount;
    this.coinsState[userId] = newBalance;
    return newBalance;
  }

  async getDailyCoinsStatus(userId: string): Promise<DailyCoinsStatus> {
    await delay(150);
    return computeDailyCoinsStatus(this.dailyClaimState[userId] ?? null);
  }

  async claimDailyCoins(userId: string): Promise<ClaimDailyCoinsResult> {
    await delay(300);
    const status = await this.getDailyCoinsStatus(userId);
    if (!status.available) {
      throw new Error('Recompensa diária ainda não disponível.');
    }
    this.dailyClaimState[userId] = new Date().toISOString();
    const newBalance = (this.coinsState[userId] ?? 200) + status.amount;
    this.coinsState[userId] = newBalance;
    return { coins: newBalance, amount: status.amount };
  }

  async getStickersByAlbumId(albumId: string): Promise<Sticker[]> {
    await delay(300);
    return mockStickers.filter((s) => s.albumId === albumId);
  }

  async getAllStickers(): Promise<Sticker[]> {
    await delay(300);
    return mockStickers;
  }

  async buyIndividualSticker(userId: string, stickerId: string, cost: number): Promise<Sticker> {
    await delay(500);

    const sticker = mockStickers.find((s) => s.id === stickerId);
    if (!sticker) throw new Error('Figurinha não encontrada');

    const userCoins = this.coinsState[userId] ?? 200;
    if (userCoins < cost) {
      throw new Error('Saldo de moedas insuficiente');
    }
    this.coinsState[userId] = userCoins - cost;

    const updatedSticker = { ...sticker, obtainedAt: new Date().toISOString() };
    const index = mockStickers.findIndex((s) => s.id === stickerId);
    if (index !== -1) mockStickers[index] = updatedSticker;

    if (!this.collectionState.stickerIds.includes(stickerId)) {
      this.collectionState.stickerIds = [...this.collectionState.stickerIds, stickerId];
    }

    const album = mockAlbums.find((a) => a.id === sticker.albumId);
    if (album) {
      const ownedInAlbum = this.collectionState.stickerIds.filter((id) =>
        mockStickers.find((s) => s.id === id)?.albumId === sticker.albumId
      ).length;
      this.collectionState.progress = (ownedInAlbum / album.totalStickers) * 100;
    }

    return updatedSticker;
  }
}
