import { FirestoreAlbumRepository } from '../../infra/repositories/FirestoreAlbumRepository';

// Para voltar ao mock: substituir FirestoreAlbumRepository por MockAlbumRepository
export const albumRepositoryInstance = new FirestoreAlbumRepository();
