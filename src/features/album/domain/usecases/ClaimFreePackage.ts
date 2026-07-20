import { Sticker } from '../entities/Sticker';
import { AlbumRepository } from '../repositories/AlbumRepository';

export class ClaimFreePackage {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async execute(userId: string): Promise<Sticker[]> {
    return this.albumRepository.claimFreePackage(userId);
  }
}
