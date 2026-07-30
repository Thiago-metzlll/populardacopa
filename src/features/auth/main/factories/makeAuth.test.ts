import { FirebaseUser } from '../../domain/entities/FirebaseUser';

/**
 * auth não tem domain/usecases (as factories chamam o repositório direto) —
 * por isso o mock aqui é do módulo de instância, não de uma interface injetada.
 */
jest.mock('./repositoryInstance', () => ({
  authRepositoryInstance: {
    signInAnonymously: jest.fn(),
    signInWithEmail: jest.fn(),
    register: jest.fn(),
    signOut: jest.fn(),
    getCurrentUser: jest.fn(),
    resetPassword: jest.fn(),
    onAuthStateChanged: jest.fn(),
  },
}));

import {
  makeGetCurrentUser,
  makeRegister,
  makeSignInAnonymously,
  makeSignInWithEmail,
  makeSignOut,
} from './makeAuth';
import { makeOnAuthStateChanged } from './makeOnAuthStateChanged';
import { makeResetPassword } from './makeResetPassword';
import { authRepositoryInstance } from './repositoryInstance';

const fakeUser: FirebaseUser = { uid: 'u1', email: 'a@a.com', displayName: null, isAnonymous: false };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('makeSignInAnonymously', () => {
  it('delega o login anônimo para authRepositoryInstance', async () => {
    (authRepositoryInstance.signInAnonymously as jest.Mock).mockResolvedValue(fakeUser);

    const result = await makeSignInAnonymously().execute();

    expect(authRepositoryInstance.signInAnonymously).toHaveBeenCalledTimes(1);
    expect(result).toBe(fakeUser);
  });
});

describe('makeSignInWithEmail', () => {
  it('delega o login para authRepositoryInstance com e-mail e senha', async () => {
    (authRepositoryInstance.signInWithEmail as jest.Mock).mockResolvedValue(fakeUser);

    const useCase = makeSignInWithEmail();
    const result = await useCase.execute('a@a.com', 'senha123');

    expect(authRepositoryInstance.signInWithEmail).toHaveBeenCalledWith('a@a.com', 'senha123');
    expect(result).toBe(fakeUser);
  });

  it('propaga o erro do repositório sem tratar', async () => {
    const error = { code: 'auth/wrong-password' };
    (authRepositoryInstance.signInWithEmail as jest.Mock).mockRejectedValue(error);

    await expect(makeSignInWithEmail().execute('a@a.com', 'errada')).rejects.toBe(error);
  });
});

describe('makeRegister', () => {
  it('delega o cadastro para authRepositoryInstance com nome, e-mail e senha', async () => {
    (authRepositoryInstance.register as jest.Mock).mockResolvedValue(fakeUser);

    const result = await makeRegister().execute('Fulano', 'novo@a.com', 'senha123');

    expect(authRepositoryInstance.register).toHaveBeenCalledWith('Fulano', 'novo@a.com', 'senha123');
    expect(result).toBe(fakeUser);
  });
});

describe('makeSignOut', () => {
  it('delega o logout para authRepositoryInstance', async () => {
    (authRepositoryInstance.signOut as jest.Mock).mockResolvedValue(undefined);

    await makeSignOut().execute();

    expect(authRepositoryInstance.signOut).toHaveBeenCalledTimes(1);
  });
});

describe('makeGetCurrentUser', () => {
  it('retorna o usuário atual do repositório', () => {
    (authRepositoryInstance.getCurrentUser as jest.Mock).mockReturnValue(fakeUser);

    expect(makeGetCurrentUser().execute()).toBe(fakeUser);
  });

  it('retorna null quando não há sessão ativa', () => {
    (authRepositoryInstance.getCurrentUser as jest.Mock).mockReturnValue(null);

    expect(makeGetCurrentUser().execute()).toBeNull();
  });
});

describe('makeResetPassword', () => {
  it('delega o reset de senha para authRepositoryInstance com o e-mail', async () => {
    (authRepositoryInstance.resetPassword as jest.Mock).mockResolvedValue(undefined);

    await makeResetPassword().execute('a@a.com');

    expect(authRepositoryInstance.resetPassword).toHaveBeenCalledWith('a@a.com');
  });
});

describe('makeOnAuthStateChanged', () => {
  it('repassa o callback ao repositório e devolve o unsubscribe', () => {
    const unsubscribe = jest.fn();
    (authRepositoryInstance.onAuthStateChanged as jest.Mock).mockReturnValue(unsubscribe);
    const callback = jest.fn();

    const result = makeOnAuthStateChanged().execute(callback);

    expect(authRepositoryInstance.onAuthStateChanged).toHaveBeenCalledWith(callback);
    expect(result).toBe(unsubscribe);
  });
});
