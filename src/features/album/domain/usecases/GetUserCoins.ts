import { AlbumRepository } from '../repositories/AlbumRepository';

export class GetUserCoins {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async execute(userId: string): Promise<number> {
    return this.albumRepository.getUserCoins(userId);
  }
}
