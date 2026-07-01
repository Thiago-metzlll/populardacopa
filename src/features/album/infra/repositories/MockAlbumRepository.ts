import { Album } from '../../domain/entities/Album';
import { Sticker } from '../../domain/entities/Sticker';
import { UserCollection } from '../../domain/entities/UserCollection';
import { AlbumRepository } from '../../domain/repositories/AlbumRepository';
import { mockAlbums, mockStickers, mockUserCollection } from '../seed/AlbumSeed';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export class MockAlbumRepository implements AlbumRepository {
  private collectionState = { ...mockUserCollection, stickerIds: [...mockUserCollection.stickerIds] };

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

  async openPackage(packageId: string, userId: string): Promise<Sticker[]> {
    await delay(500);
    
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
}
