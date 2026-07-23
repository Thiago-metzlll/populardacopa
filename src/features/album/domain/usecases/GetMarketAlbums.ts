import { Album } from '../entities/Album';
import { AlbumRepository } from '../repositories/AlbumRepository';

export class GetMarketAlbums {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async execute(userId: string): Promise<Album[]> {
    return this.albumRepository.getMarketAlbums(userId);
  }
}
