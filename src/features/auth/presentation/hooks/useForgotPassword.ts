import { useState } from 'react';
import { makeResetPassword } from '../../main/factories/makeResetPassword';

interface ForgotPasswordState {
  loading: boolean;
  error: string | null;
  sent: boolean;
}

/**
 * Hook de recuperação de senha via email do Firebase.
 */
export function useForgotPassword() {
  const [state, setState] = useState<ForgotPasswordState>({
    loading: false,
    error: null,
    sent: false,
  });

  const execute = async (email: string) => {
    setState({ loading: true, error: null, sent: false });
    try {
      await makeResetPassword().execute(email);
      setState({ loading: false, error: null, sent: true });
      return true;
    } catch (err: unknown) {
      const message = getForgotErrorMessage(err);
      setState({ loading: false, error: message, sent: false });
      return false;
    }
  };

  return { ...state, execute };
}

function getForgotErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code: string }).code;
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/invalid-email':
        return 'Email não encontrado.';
      case 'auth/network-request-failed':
        return 'Sem conexão com a internet.';
      default:
        return 'Erro ao enviar email. Tente novamente.';
    }
  }
  return 'Erro ao enviar email. Tente novamente.';
}
