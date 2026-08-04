/**
 * Script de seed — cria um usuário de exemplo no Firestore.
 * Usa o Firebase ADMIN SDK (server-side) com o service account.
 *
 * ⚠️  PRÉ-REQUISITOS:
 *   1. Revogue a chave anterior e gere uma nova:
 *      Firebase Console → Project Settings → Service accounts → Generate new private key
 *   2. Salve a chave em scripts/serviceAccountKey.json (gitignored) ou aponte
 *      GOOGLE_APPLICATION_CREDENTIALS para o caminho dela
 *   3. Instale as dependências do script:
 *      npm install --save-dev firebase-admin ts-node
 *
 * COMO RODAR:
 *   npx ts-node scripts/seedFirestoreUser.ts
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as admin from 'firebase-admin';

const serviceAccountPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS || join(__dirname, 'serviceAccountKey.json');

/**
 * A chave é lida em runtime, e não por `import` estático, porque o arquivo é
 * gitignored: um import faria o `tsc --noEmit` falhar em qualquer checkout limpo.
 */
function loadServiceAccount(): admin.ServiceAccount {
  if (!existsSync(serviceAccountPath)) {
    console.error(
      `❌ Service account não encontrada em ${serviceAccountPath}\n` +
        '   Gere a chave no Firebase Console → Project Settings → Service accounts\n' +
        '   e salve em scripts/serviceAccountKey.json (ou defina GOOGLE_APPLICATION_CREDENTIALS).',
    );
    process.exit(1);
  }

  return JSON.parse(readFileSync(serviceAccountPath, 'utf8')) as admin.ServiceAccount;
}

// Inicializa o Admin SDK com a service account
admin.initializeApp({
  credential: admin.credential.cert(loadServiceAccount()),
});

const db = admin.firestore();
const authAdmin = admin.auth();

async function seedUser() {
  const email = 'elianam@populardacopa.com';
  const password = 'Copa2026!';
  const name = 'Eliana';

  console.log(`\n🔥 Criando usuário de exemplo: ${email}`);

  try {
    // 1. Cria usuário no Firebase Auth via Admin SDK
    const userRecord = await authAdmin.createUser({
      email,
      password,
      displayName: name,
    });
    console.log(`✅ Auth: uid gerado → ${userRecord.uid}`);

    // 2. Cria documento no Firestore com dados iniciais realistas
    const stickerIds = Array.from({ length: 78 }, (_, i) => `s${i + 1}`);
    const progress = (stickerIds.length / 100) * 100; // 78%

    await db.collection('users').doc(userRecord.uid).set({
      name,
      email,
      coins: 200,
      stickerIds,
      progress,
      favoriteTeamIds: ['t1', 't3'],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Firestore: documento criado em users/${userRecord.uid}`);

    // 3. Palpites de demonstração na coleção raiz `predictions`.
    //    Os palpites deixaram de ter seed em código (o MockPredictionRepository
    //    saiu na Fase 7 do testing-plan) — quem quiser ver a Tela Histórico e o
    //    settlement funcionando sem palpitar à mão precisa deste seed.
    //    m9 já está FINISHED no SQLite (2x1), então o palpite abaixo é resolvido
    //    como vencedor assim que a Tela Apostas monta.
    const demoPredictions = [
      {
        userId: userRecord.uid,
        matchId: 'm9',
        predictedHomeScore: 2,
        predictedAwayScore: 1,
        reward: { type: 'coins', description: '+80 moedas', coinAmount: 80 },
        status: 'pending',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        userId: userRecord.uid,
        matchId: 'm1',
        predictedHomeScore: 3,
        predictedAwayScore: 0,
        reward: { type: 'coins', description: '+50 moedas', coinAmount: 50 },
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ];

    for (const prediction of demoPredictions) {
      await db.collection('predictions').add(prediction);
    }

    console.log(`✅ Firestore: ${demoPredictions.length} palpites criados em predictions/`);
    console.log(`\n📋 Dados criados:`);
    console.log(`   • Nome: ${name}`);
    console.log(`   • Email: ${email}`);
    console.log(`   • Moedas: 200`);
    console.log(`   • Figurinhas: ${stickerIds.length} (${progress}% do álbum)`);
    console.log(`   • Times favoritos: Brasil (t1), Argentina (t3)`);
    console.log(`   • Palpites: 1 em partida finalizada (m9, vira vitória no settlement) + 1 agendada (m1)`);
    console.log(`\n🎉 Seed concluído! Faça login no app com: ${email} / ${password}\n`);
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'auth/email-already-exists') {
      console.log('⚠️  Usuário já existe — seed ignorado.');
    } else {
      console.error('❌ Erro:', err.message);
      process.exit(1);
    }
  }

  process.exit(0);
}

seedUser();

