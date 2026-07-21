import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
// @ts-ignore
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';


// Valida variáveis obrigatórias antes de inicializar o Firebase
const requiredEnvVars = {
  EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value || value.includes('SUA_') || value.includes('SEU_'))
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(
    `[Firebase] Variáveis de ambiente ausentes ou com valores placeholder:\n` +
    missingVars.map((v) => `  - ${v}`).join('\n') +
    `\n\nPreencha o arquivo .env na raiz do projeto com as credenciais do Firebase Console.` +
    `\nConsole → Project Settings → Your apps → SDK setup and configuration → Config`
  );
}

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

// initializeAuth com getReactNativePersistence garante que a sessão sobrevive
// a restarts do app. O try/catch segue o mesmo padrão singleton do db acima:
// re-inicializar lança erro em hot reload, então o fallback usa getAuth.
let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}
export { auth };
export default app;
