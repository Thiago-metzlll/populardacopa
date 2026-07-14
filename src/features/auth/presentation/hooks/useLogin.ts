import { useState } from 'react';
import { makeSignInWithEmail } from '../../main/factories/makeAuth';

interface LoginState {
  loading: boolean;
  error: string | null;
}

/**
 * Hook de login por email/senha.
 * Chama a factory makeSignInWithEmail — sem importar Firebase diretamente.
 */
export function useLogin() {
  const [state, setState] = useState<LoginState>({ loading: false, error: null });

  const execute = async (email: string, password: string) => {
    setState({ loading: true, error: null });
    try {
      await makeSignInWithEmail().execute(email, password);
      setState({ loading: false, error: null });
      return true;
    } catch (err: unknown) {
      const message = getAuthErrorMessage(err);
      setState({ loading: false, error: message });
      return false;
    }
  };

  return { ...state, execute };
}

function getAuthErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code: string }).code;
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Email ou senha incorretos.';
      case 'auth/invalid-email':
        return 'Email inválido.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Tente novamente mais tarde.';
      case 'auth/network-request-failed':
        return 'Sem conexão com a internet.';
      default:
        return 'Erro ao fazer login. Tente novamente.';
    }
  }
  return 'Erro ao fazer login. Tente novamente.';
}
