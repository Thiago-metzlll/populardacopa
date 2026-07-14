import { Album } from '../entities/Album';
import { AlbumRepository } from '../repositories/AlbumRepository';

export class GetAlbumById {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async execute(id: string): Promise<Album> {
    return this.albumRepository.getAlbumById(id);
  }
}
