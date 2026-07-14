import { useState } from 'react';
import { makeRegister } from '../../main/factories/makeAuth';

interface RegisterState {
  loading: boolean;
  error: string | null;
}

/**
 * Hook de cadastro por nome/email/senha.
 */
export function useRegister() {
  const [state, setState] = useState<RegisterState>({ loading: false, error: null });

  const execute = async (name: string, email: string, password: string) => {
    setState({ loading: true, error: null });
    try {
      await makeRegister().execute(name, email, password);
      setState({ loading: false, error: null });
      return true;
    } catch (err: unknown) {
      const message = getRegisterErrorMessage(err);
      setState({ loading: false, error: message });
      return false;
    }
  };

  return { ...state, execute };
}

function getRegisterErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code: string }).code;
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Este email já está em uso.';
      case 'auth/invalid-email':
        return 'Email inválido.';
      case 'auth/weak-password':
        return 'Senha fraca. Use ao menos 6 caracteres.';
      case 'auth/network-request-failed':
        return 'Sem conexão com a internet.';
      default:
        return 'Erro ao criar conta. Tente novamente.';
    }
  }
  return 'Erro ao criar conta. Tente novamente.';
}
