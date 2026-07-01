import { Sticker } from '../entities/Sticker';
import { UserCollection } from '../entities/UserCollection';
import { AlbumRepository } from '../repositories/AlbumRepository';

export interface UserProfileResult {
  collection: UserCollection;
  stickers: Sticker[];
  recentStickers: Sticker[];
  rareStickers: Sticker[];
}

export class GetUserProfile {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async execute(userId: string): Promise<UserProfileResult> {
    const collection = await this.albumRepository.getUserCollection(userId);
    const stickers = await this.albumRepository.getStickersByIds(collection.stickerIds);

    // Ordenando explicitamente por obtainedAt (mais recente primeiro)
    const sortedStickers = [...stickers].sort((a, b) => {
      return new Date(b.obtainedAt).getTime() - new Date(a.obtainedAt).getTime();
    });

    const rareStickers = sortedStickers.filter(
      (sticker) => sticker.rarity === 'rara' || sticker.rarity === 'lendaria'
    );

    const recentStickers = sortedStickers.slice(0, 10);

    return {
      collection,
      stickers,
      recentStickers,
      rareStickers,
    };
  }
}
