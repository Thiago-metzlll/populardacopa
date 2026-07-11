/**
 * TELA DE DIAGNÓSTICO — Firebase Connection Test
 *
 * Acesse via: http://localhost:8081/firebase-test  (modo web)
 * ou navegue para a rota "/firebase-test" no app.
 *
 * REMOVA este arquivo após confirmar a conexão.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../src/shared/infra/firebase/firebaseConfig';
import { COLLECTIONS, USER_FIELDS } from '../src/shared/infra/firebase/collections';

type TestStatus = 'idle' | 'running' | 'ok' | 'error';

interface TestResult {
  name: string;
  status: TestStatus;
  detail: string;
}

const TEST_UID = 'test-user-diagnostics-001';

export default function FirebaseTestScreen() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  function addResult(result: TestResult) {
    setResults((prev) => [...prev, result]);
  }

  function updateLast(patch: Partial<TestResult>) {
    setResults((prev) => {
      const copy = [...prev];
      copy[copy.length - 1] = { ...copy[copy.length - 1], ...patch };
      return copy;
    });
  }

  async function runTests() {
    setResults([]);
    setRunning(true);

    // ── 1. Variáveis de ambiente ────────────────────────────────────────────
    addResult({ name: '1. Variáveis de ambiente', status: 'running', detail: 'Verificando...' });
    const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
    const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;

    if (apiKey && projectId) {
      updateLast({
        status: 'ok',
        detail: `projectId="${projectId}" • apiKey termina em ...${apiKey.slice(-6)}`,
      });
    } else {
      updateLast({
        status: 'error',
        detail: `Chaves ausentes — apiKey=${!!apiKey} projectId=${!!projectId}`,
      });
      setRunning(false);
      return;
    }

    // ── 2. Escrita na coleção users ─────────────────────────────────────────
    addResult({ name: '2. Firestore — gravar users/' + TEST_UID, status: 'running', detail: 'Gravando documento...' });
    const ref = doc(db, COLLECTIONS.USERS, TEST_UID);
    try {
      await setDoc(
        ref,
        {
          [USER_FIELDS.NAME]: 'Usuário Teste',
          [USER_FIELDS.EMAIL]: 'teste@diagnostico.dev',
          [USER_FIELDS.COINS]: 200,
          [USER_FIELDS.STICKER_IDS]: [],
          [USER_FIELDS.PROGRESS]: 0,
          [USER_FIELDS.FAVORITE_TEAM_IDS]: [],
          [USER_FIELDS.CREATED_AT]: serverTimestamp(),
        },
        { merge: true },
      );
      updateLast({ status: 'ok', detail: `users/${TEST_UID} gravado com sucesso` });
    } catch (err: any) {
      console.error('Erro Firestore Detalhado:', err);
      const errCode = err?.code || 'sem código';
      const errMsg = err?.message || String(err);
      const errStack = err?.stack ? `\nStack: ${err.stack.split('\n')[0]}` : '';
      updateLast({ 
        status: 'error', 
        detail: `[${errCode}] ${errMsg}${errStack}`
      });
      setRunning(false);
      return;
    }

    // ── 3. Leitura da coleção users ─────────────────────────────────────────
    addResult({ name: '3. Firestore — ler users/' + TEST_UID, status: 'running', detail: 'Lendo documento...' });
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        updateLast({
          status: 'ok',
          detail: `name="${data[USER_FIELDS.NAME]}" • coins=${data[USER_FIELDS.COINS]}`,
        });
      } else {
        updateLast({ status: 'error', detail: 'Documento não encontrado após gravação' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      updateLast({ status: 'error', detail: msg });
    }

    // ── 4. Limpeza ──────────────────────────────────────────────────────────
    addResult({ name: '4. Limpeza — deletar documento de teste', status: 'running', detail: 'Deletando...' });
    try {
      await deleteDoc(ref);
      updateLast({ status: 'ok', detail: `users/${TEST_UID} removido` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      updateLast({ status: 'error', detail: msg });
    }

    setRunning(false);
  }

  async function seedUsers() {
    setResults([]);
    setRunning(true);
    addResult({ name: 'Seed 4 Usuários', status: 'running', detail: 'Criando...' });
    
    const mockUsers = [
      { id: 'user1', name: 'João Silva', email: 'joao@teste.com', coins: 150, favoriteTeamIds: ['brazil'] },
      { id: 'user2', name: 'Maria Souza', email: 'maria@teste.com', coins: 300, favoriteTeamIds: ['argentina'] },
      { id: 'user3', name: 'Carlos Alberto', email: 'carlos@teste.com', coins: 50, favoriteTeamIds: ['france'] },
      { id: 'user4', name: 'Ana Clara', email: 'ana@teste.com', coins: 500, favoriteTeamIds: ['germany'] },
    ];

    try {
      for (const u of mockUsers) {
        const ref = doc(db, COLLECTIONS.USERS, u.id);
        await setDoc(ref, {
          [USER_FIELDS.NAME]: u.name,
          [USER_FIELDS.EMAIL]: u.email,
          [USER_FIELDS.COINS]: u.coins,
          [USER_FIELDS.STICKER_IDS]: [],
          [USER_FIELDS.PROGRESS]: 0,
          [USER_FIELDS.FAVORITE_TEAM_IDS]: u.favoriteTeamIds,
          [USER_FIELDS.CREATED_AT]: serverTimestamp(),
        }, { merge: true });
      }
      updateLast({ status: 'ok', detail: '4 usuários criados com sucesso!' });
    } catch (err: any) {
      updateLast({ status: 'error', detail: `Erro: ${err.message || String(err)}` });
    }
    setRunning(false);
  }

  const allPassed =
    results.length === 4 && results.every((r) => r.status === 'ok');
  const hasFailed = results.some((r) => r.status === 'error');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🔥 Firebase — Diagnóstico</Text>
      <Text style={styles.subtitle}>
        Testa leitura/escrita na coleção users — sem Auth
      </Text>

      <TouchableOpacity
        style={[styles.button, running && styles.buttonDisabled]}
        onPress={runTests}
        disabled={running}
      >
        {running ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>▶ Rodar Testes</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#10b981' }, running && styles.buttonDisabled]}
        onPress={seedUsers}
        disabled={running}
      >
        <Text style={styles.buttonText}>🌱 Popular 4 Usuários (Seed)</Text>
      </TouchableOpacity>

      {results.map((r, i) => (
        <View key={i} style={[styles.card, styles[`card_${r.status}`]]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>{statusIcon(r.status)}</Text>
            <Text style={styles.cardName}>{r.name}</Text>
          </View>
          <Text style={styles.cardDetail}>{r.detail}</Text>
        </View>
      ))}

      {allPassed && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            ✅ Todos os testes passaram! Firebase está conectado.
          </Text>
        </View>
      )}
      {hasFailed && !running && (
        <View style={[styles.banner, styles.bannerError]}>
          <Text style={styles.bannerText}>
            ❌ Algum teste falhou. Veja o detalhe acima.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function statusIcon(s: TestStatus) {
  switch (s) {
    case 'running': return '⏳';
    case 'ok':      return '✅';
    case 'error':   return '❌';
    default:        return '⬜';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  content: { padding: 20, paddingBottom: 60 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginTop: 20,
    marginBottom: 4,
  },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 24 },
  button: {
    backgroundColor: '#e85d04',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  card_idle:    { backgroundColor: '#1e1e2e', borderLeftColor: '#444' },
  card_running: { backgroundColor: '#1e1e2e', borderLeftColor: '#f59e0b' },
  card_ok:      { backgroundColor: '#052e16', borderLeftColor: '#22c55e' },
  card_error:   { backgroundColor: '#2d0000', borderLeftColor: '#ef4444' },

  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardIcon: { fontSize: 16, marginRight: 8 },
  cardName: { fontWeight: '700', color: '#e5e5e5', fontSize: 14 },
  cardDetail: { color: '#aaa', fontSize: 12, fontFamily: 'monospace' },

  banner: {
    backgroundColor: '#052e16',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  bannerError: { backgroundColor: '#2d0000' },
  bannerText: { color: '#fff', fontWeight: '700', fontSize: 15, textAlign: 'center' },
});
