import { Sticker } from '../entities/Sticker';
import { AlbumRepository } from '../repositories/AlbumRepository';

export class GetStickersByIds {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async execute(ids: string[]): Promise<Sticker[]> {
    return this.albumRepository.getStickersByIds(ids);
  }
}
