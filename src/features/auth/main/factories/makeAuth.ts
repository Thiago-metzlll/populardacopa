import { authRepositoryInstance } from './repositoryInstance';

/**
 * Factory para o caso de uso de login anônimo.
 * Retorna uma função executável — pattern sem classe para casos simples.
 */
export const makeSignInAnonymously = () => ({
  execute: () => authRepositoryInstance.signInAnonymously(),
});

export const makeSignInWithEmail = () => ({
  execute: (email: string, password: string) =>
    authRepositoryInstance.signInWithEmail(email, password),
});

export const makeRegister = () => ({
  execute: (name: string, email: string, password: string) =>
    authRepositoryInstance.register(name, email, password),
});

export const makeSignOut = () => ({
  execute: () => authRepositoryInstance.signOut(),
});

export const makeGetCurrentUser = () => ({
  execute: () => authRepositoryInstance.getCurrentUser(),
});
