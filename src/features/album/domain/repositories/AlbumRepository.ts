import { Album } from '../entities/Album';
import { Sticker } from '../entities/Sticker';
import { UserCollection } from '../entities/UserCollection';

export interface AlbumRepository {
  getUserCollection(userId: string): Promise<UserCollection>;
  getAlbumById(id: string): Promise<Album>;
  getStickersByIds(ids: string[]): Promise<Sticker[]>;
  openPackage(packageId: string, userId: string): Promise<Sticker[]>;
}
