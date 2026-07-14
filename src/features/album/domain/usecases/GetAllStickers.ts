import { Sticker } from '../entities/Sticker';
import { AlbumRepository } from '../repositories/AlbumRepository';

export class GetAllStickers {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async execute(): Promise<Sticker[]> {
    return this.albumRepository.getAllStickers();
  }
}
