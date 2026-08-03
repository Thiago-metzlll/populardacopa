jest.mock('firebase/auth', () => ({
  signInAnonymously: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => 'USER_DOC_REF'),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
}));

jest.mock('../../../../../shared/infra/firebase/firebaseConfig', () => ({
  auth: { currentUser: null },
  db: {},
}));

import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { setDoc } from 'firebase/firestore';
import { auth } from '../../../../../shared/infra/firebase/firebaseConfig';
import { FirebaseAuthRepository } from '../../../infra/repositories/FirebaseAuthRepository';

const fakeUser = { uid: 'u1', email: 'a@a.com', displayName: 'Fulano', isAnonymous: false };

beforeEach(() => {
  jest.clearAllMocks();
  (auth as any).currentUser = null;
});

describe('FirebaseAuthRepository', () => {
  const sut = new FirebaseAuthRepository();

  describe('signInAnonymously', () => {
    it('faz login anônimo, garante o documento do usuário e mapeia o retorno', async () => {
      (signInAnonymously as jest.Mock).mockResolvedValue({ user: { ...fakeUser, isAnonymous: true } });

      const result = await sut.signInAnonymously();

      expect(signInAnonymously).toHaveBeenCalledWith(auth);
      expect(setDoc).toHaveBeenCalledWith(
        'USER_DOC_REF',
        expect.objectContaining({ name: 'Anônimo', email: '' }),
        { merge: true },
      );
      expect(result).toEqual({ uid: 'u1', email: 'a@a.com', displayName: 'Fulano', isAnonymous: true });
    });
  });

  describe('signInWithEmail', () => {
    it('autentica com e-mail/senha e preserva nome e e-mail no documento do usuário', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: fakeUser });

      const result = await sut.signInWithEmail('a@a.com', 'senha123');

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'a@a.com', 'senha123');
      expect(setDoc).toHaveBeenCalledWith(
        'USER_DOC_REF',
        expect.objectContaining({ name: 'Fulano', email: 'a@a.com' }),
        { merge: true },
      );
      expect(result).toEqual(fakeUser);
    });
  });

  describe('register', () => {
    it('cria o usuário, atualiza o displayName e cria o documento com o nome informado', async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: { ...fakeUser, displayName: null } });

      await sut.register('Novo Usuário', 'novo@a.com', 'senha123');

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'novo@a.com', 'senha123');
      expect(updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ displayName: null }),
        { displayName: 'Novo Usuário' },
      );
      expect(setDoc).toHaveBeenCalledWith(
        'USER_DOC_REF',
        expect.objectContaining({ name: 'Novo Usuário' }),
        { merge: true },
      );
    });
  });

  it('signOut delega para o signOut do Firebase Auth', async () => {
    await sut.signOut();

    expect(signOut).toHaveBeenCalledWith(auth);
  });

  describe('getCurrentUser', () => {
    it('retorna null quando não há usuário autenticado', () => {
      (auth as any).currentUser = null;

      expect(sut.getCurrentUser()).toBeNull();
    });

    it('retorna o usuário mapeado quando há sessão ativa', () => {
      (auth as any).currentUser = fakeUser;

      expect(sut.getCurrentUser()).toEqual(fakeUser);
    });
  });

  it('resetPassword delega para sendPasswordResetEmail com o e-mail recebido', async () => {
    await sut.resetPassword('a@a.com');

    expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, 'a@a.com');
  });

  describe('onAuthStateChanged', () => {
    it('repassa a inscrição para o Firebase Auth e mapeia o usuário no callback', () => {
      const unsubscribe = jest.fn();
      (onAuthStateChanged as jest.Mock).mockImplementation((_auth, internalCallback) => {
        internalCallback(fakeUser);
        return unsubscribe;
      });
      const externalCallback = jest.fn();

      const result = sut.onAuthStateChanged(externalCallback);

      expect(externalCallback).toHaveBeenCalledWith(fakeUser);
      expect(result).toBe(unsubscribe);
    });

    it('chama o callback com null quando o usuário desloga', () => {
      (onAuthStateChanged as jest.Mock).mockImplementation((_auth, internalCallback) => {
        internalCallback(null);
        return jest.fn();
      });
      const externalCallback = jest.fn();

      sut.onAuthStateChanged(externalCallback);

      expect(externalCallback).toHaveBeenCalledWith(null);
    });
  });
});
