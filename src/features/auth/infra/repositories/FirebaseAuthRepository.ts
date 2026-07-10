import {
  signInAnonymously as fbSignInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../../shared/infra/firebase/firebaseConfig';
import { COLLECTIONS, USER_FIELDS } from '../../../../shared/infra/firebase/collections';
import { AuthRepository } from '../../domain/repositories/AuthRepository';
import { FirebaseUser } from '../../domain/entities/FirebaseUser';

/**
 * Mapeia o User do Firebase SDK para a entidade de domínio FirebaseUser.
 * Mantém o domínio desacoplado do SDK.
 */
function toFirebaseUser(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
}): FirebaseUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    isAnonymous: user.isAnonymous,
  };
}

/**
 * Cria (ou garante a existência de) o documento do usuário no Firestore.
 * Usa `setDoc` com `merge: true` para não sobrescrever dados existentes.
 */
async function ensureUserDocument(
  uid: string,
  name: string | null,
  email: string | null,
): Promise<void> {
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  await setDoc(
    userRef,
    {
      [USER_FIELDS.NAME]: name ?? 'Anônimo',
      [USER_FIELDS.EMAIL]: email ?? '',
      [USER_FIELDS.COINS]: 200,
      [USER_FIELDS.STICKER_IDS]: [],
      [USER_FIELDS.PROGRESS]: 0,
      [USER_FIELDS.FAVORITE_TEAM_IDS]: [],
      [USER_FIELDS.CREATED_AT]: serverTimestamp(),
    },
    { merge: true }, // preserva campos já existentes
  );
}

export class FirebaseAuthRepository implements AuthRepository {
  async signInAnonymously(): Promise<FirebaseUser> {
    const { user } = await fbSignInAnonymously(auth);
    await ensureUserDocument(user.uid, null, null);
    return toFirebaseUser(user);
  }

  async signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserDocument(user.uid, user.displayName, user.email);
    return toFirebaseUser(user);
  }

  async register(name: string, email: string, password: string): Promise<FirebaseUser> {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName: name });
    await ensureUserDocument(user.uid, name, email);
    return toFirebaseUser(user);
  }

  async signOut(): Promise<void> {
    await fbSignOut(auth);
  }

  getCurrentUser(): FirebaseUser | null {
    const user = auth.currentUser;
    if (!user) return null;
    return toFirebaseUser(user);
  }
}
