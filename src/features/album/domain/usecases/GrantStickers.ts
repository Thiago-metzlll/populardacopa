import { Sticker } from '../entities/Sticker';
import { AlbumRepository } from '../repositories/AlbumRepository';

export class GrantStickers {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async execute(userId: string, stickerIds: string[]): Promise<Sticker[]> {
    return this.albumRepository.grantStickers(userId, stickerIds);
  }
}
