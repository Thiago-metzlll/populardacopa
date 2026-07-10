/**
 * Representa o usuário autenticado retornado pelo Firebase Auth.
 * Entidade de domínio — sem dependência do SDK do Firebase.
 */
export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
}
