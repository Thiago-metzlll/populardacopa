import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { User } from '../../domain/entities/User';
import { FirebaseUser } from '../../../features/auth/domain/entities/FirebaseUser';
import { makeOnAuthStateChanged } from '../../../features/auth/main/factories/makeOnAuthStateChanged';

interface UserContextData {
  user: User | null;
  loading: boolean;
}

const UserContext = createContext<UserContextData>({} as UserContextData);

/**
 * Rotas que podem ser acessadas sem autenticação.
 * Qualquer segmento não listado aqui será protegido.
 */
const PUBLIC_SEGMENTS = ['(tabs)', 'index', 'times', 'grupos', 'players', 'entrar', 'cadastro', 'esqueci-senha'];

function isProtectedRoute(segments: string[]): boolean {
  // Rotas protegidas por segmento
  const PROTECTED = ['perfil', 'mercado', 'abrir-pacote', 'figurinhas', 'figurinha'];
  return segments.some((seg) => PROTECTED.includes(seg));
}

/**
 * Converte FirebaseUser (auth) → User (domínio shared).
 * Nesta fase, coins e favoriteTeamIds são valores-padrão —
 * a busca do perfil completo no Firestore fica para a próxima fase.
 */
function toUser(fbUser: FirebaseUser): User {
  return {
    id: fbUser.uid,
    name: fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'Usuário',
    email: fbUser.email ?? '',
    coins: 0,
    favoriteTeamIds: [],
  };
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useContext(UserContext);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user && isProtectedRoute(segments)) {
      router.replace('/entrar');
    }
  }, [user, loading, segments]);

  return <>{children}</>;
}

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = makeOnAuthStateChanged().execute((fbUser: FirebaseUser | null) => {
      setUser(fbUser ? toUser(fbUser) : null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      <AuthGuard>{children}</AuthGuard>
    </UserContext.Provider>
  );
};

export const useCurrentUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useCurrentUser must be used within a UserProvider');
  }
  return context.user;
};

export const useAuthLoading = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useAuthLoading must be used within a UserProvider');
  }
  return context.loading;
};
