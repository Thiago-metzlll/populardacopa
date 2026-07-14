import { UserCollection } from '../entities/UserCollection';
import { AlbumRepository } from '../repositories/AlbumRepository';

export class GetUserCollection {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async execute(userId: string): Promise<UserCollection> {
    return this.albumRepository.getUserCollection(userId);
  }
}
