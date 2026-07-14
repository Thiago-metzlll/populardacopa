import { authRepositoryInstance } from './repositoryInstance';

/**
 * Factory para o caso de uso de reset de senha por email.
 */
export const makeResetPassword = () => ({
  execute: (email: string) => authRepositoryInstance.resetPassword(email),
});
