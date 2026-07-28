import { FirebaseUser } from '../../domain/entities/FirebaseUser';

/**
 * auth não tem domain/usecases (as factories chamam o repositório direto) —
 * por isso o mock aqui é do módulo de instância, não de uma interface injetada.
 */
jest.mock('./repositoryInstance', () => ({
  authRepositoryInstance: {
    signInWithEmail: jest.fn(),
  },
}));

import { makeSignInWithEmail } from './makeAuth';
import { authRepositoryInstance } from './repositoryInstance';

describe('makeSignInWithEmail', () => {
  it('delega o login para authRepositoryInstance com e-mail e senha', async () => {
    const expected: FirebaseUser = { uid: 'u1', email: 'a@a.com', displayName: null, isAnonymous: false };
    (authRepositoryInstance.signInWithEmail as jest.Mock).mockResolvedValue(expected);

    const useCase = makeSignInWithEmail();
    const result = await useCase.execute('a@a.com', 'senha123');

    expect(authRepositoryInstance.signInWithEmail).toHaveBeenCalledWith('a@a.com', 'senha123');
    expect(result).toBe(expected);
  });
});
