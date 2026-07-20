import { AlbumRepository } from '../repositories/AlbumRepository';
import { DailyCoinsStatus } from '../constants/rewards';

export class GetDailyCoinsStatus {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async execute(userId: string): Promise<DailyCoinsStatus> {
    return this.albumRepository.getDailyCoinsStatus(userId);
  }
}
