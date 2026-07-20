import { AlbumRepository } from '../repositories/AlbumRepository';
import { DailyClaimStatus } from '../constants/rewards';

export class GetFreePackStatus {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async execute(userId: string): Promise<DailyClaimStatus> {
    return this.albumRepository.getFreePackStatus(userId);
  }
}
