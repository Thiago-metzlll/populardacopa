import { authRepositoryInstance } from './repositoryInstance';

/**
 * Factory para o caso de uso de listener reativo de autenticação.
 * Retorna um unsubscribe quando chamado — o chamador deve invocar no cleanup.
 */
export const makeOnAuthStateChanged = () => ({
  execute: (callback: (user: import('../../domain/entities/FirebaseUser').FirebaseUser | null) => void) =>
    authRepositoryInstance.onAuthStateChanged(callback),
});
