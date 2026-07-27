import { FirestoreAlbumRepository } from '../../infra/repositories/FirestoreAlbumRepository';
import { SQLiteAlbumCatalogRepository } from '../../infra/repositories/SQLiteAlbumCatalogRepository';

const catalogRepository = new SQLiteAlbumCatalogRepository();
export const albumRepositoryInstance = new FirestoreAlbumRepository(catalogRepository);

