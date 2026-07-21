import { FirebaseUser } from '../../domain/entities/FirebaseUser';
import { authRepositoryInstance } from './repositoryInstance';

/**
 * Factory para o caso de uso de listener reativo de autenticação.
 * Retorna um unsubscribe quando chamado — o chamador deve invocar no cleanup.
 */
export const makeOnAuthStateChanged = () => ({
  execute: (callback: (user: FirebaseUser | null) => void) =>
    authRepositoryInstance.onAuthStateChanged(callback),
});
