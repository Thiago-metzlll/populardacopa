import { Sticker } from '../entities/Sticker';
import { AlbumRepository } from '../repositories/AlbumRepository';

export class GetAlbumStickers {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async execute(albumId: string): Promise<Sticker[]> {
    return this.albumRepository.getStickersByAlbumId(albumId);
  }
}
