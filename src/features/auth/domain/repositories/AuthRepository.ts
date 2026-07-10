import { FirebaseUser } from '../entities/FirebaseUser';

/**
 * Interface de domínio para autenticação.
 * A implementação concreta fica na camada Infra — jamais importada aqui.
 */
export interface AuthRepository {
  signInAnonymously(): Promise<FirebaseUser>;
  signInWithEmail(email: string, password: string): Promise<FirebaseUser>;
  register(name: string, email: string, password: string): Promise<FirebaseUser>;
  signOut(): Promise<void>;
  getCurrentUser(): FirebaseUser | null;
}
