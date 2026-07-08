import { AlbumRepository, BuyStickerPackResult } from '../repositories/AlbumRepository';

export class BuyStickerPack {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async execute(userId: string, albumId: string, cost: number): Promise<BuyStickerPackResult> {
    return this.albumRepository.buyStickerPack(userId, albumId, cost);
  }
}
