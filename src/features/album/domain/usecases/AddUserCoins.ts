import { AlbumRepository } from '../repositories/AlbumRepository';

export class AddUserCoins {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async execute(userId: string, amount: number): Promise<number> {
    return this.albumRepository.addUserCoins(userId, amount);
  }
}
