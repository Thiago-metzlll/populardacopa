import { Sticker } from '../entities/Sticker';
import { AlbumRepository } from '../repositories/AlbumRepository';

export class BuyIndividualSticker {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async execute(userId: string, stickerId: string, cost: number): Promise<Sticker> {
    return this.albumRepository.buyIndividualSticker(userId, stickerId, cost);
  }
}
