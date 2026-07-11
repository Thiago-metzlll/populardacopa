import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

/**
 * Credenciais Firebase via variáveis de ambiente.
 * Crie um arquivo .env na raiz do projeto com as chaves abaixo
 * (veja .env.example para o template).
 * Prefixo EXPO_PUBLIC_ é obrigatório para o Expo expor vars ao bundle.
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Garante singleton — evita re-inicialização em hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// initializeFirestore lança erro se chamado duas vezes no mesmo app (hot reload).
// databaseId: '(default)' é especificado explicitamente — bug conhecido no SDK v12
// onde o banco não é encontrado sem o ID explícito em alguns projetos.
let db: ReturnType<typeof getFirestore>;
try {
  db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
  }, 'default');
} catch {
  db = getFirestore(app, 'default');
}
export { db };
export const auth = getAuth(app);
export default app;
