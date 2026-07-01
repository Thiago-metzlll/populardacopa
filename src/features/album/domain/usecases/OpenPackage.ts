import { Sticker } from '../entities/Sticker';
import { AlbumRepository } from '../repositories/AlbumRepository';

export class OpenPackage {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async execute(packageId: string, userId: string): Promise<Sticker[]> {
    return this.albumRepository.openPackage(packageId, userId);
  }
}
