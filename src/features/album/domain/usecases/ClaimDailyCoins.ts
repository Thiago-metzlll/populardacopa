import { AlbumRepository, ClaimDailyCoinsResult } from '../repositories/AlbumRepository';

export class ClaimDailyCoins {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async execute(userId: string): Promise<ClaimDailyCoinsResult> {
    return this.albumRepository.claimDailyCoins(userId);
  }
}
