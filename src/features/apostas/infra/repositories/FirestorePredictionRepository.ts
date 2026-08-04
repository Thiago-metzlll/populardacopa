import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { COLLECTIONS, PREDICTION_FIELDS } from '../../../../shared/infra/firebase/collections';
import { db } from '../../../../shared/infra/firebase/firebaseConfig';
import { computePredictionStats } from '../../domain/constants/predictionStats';
import { Prediction } from '../../domain/entities/Prediction';
import { PredictionHistory } from '../../domain/entities/PredictionHistory';
import { PredictionRepository } from '../../domain/repositories/PredictionRepository';

/**
 * FirestorePredictionRepository
 *
 * Palpites do usuário → Firestore, na coleção raiz `predictions`.
 * Raiz e não subcoleção de `users` porque `updatePredictionStatus` recebe só o
 * `predictionId` (ver comentário em collections.ts).
 *
 * A ordenação do histórico é feita no cliente, e não com `orderBy` na query:
 * `where` + `orderBy` em campos diferentes exigiria um índice composto no
 * Firestore, e o volume por usuário não justifica isso.
 */
export class FirestorePredictionRepository implements PredictionRepository {
  private predictionsRef() {
    return collection(db, COLLECTIONS.PREDICTIONS);
  }

  private toPrediction(id: string, data: Record<string, unknown>): Prediction {
    return {
      id,
      userId: data[PREDICTION_FIELDS.USER_ID] as string,
      matchId: data[PREDICTION_FIELDS.MATCH_ID] as string,
      predictedHomeScore: data[PREDICTION_FIELDS.PREDICTED_HOME_SCORE] as number,
      predictedAwayScore: data[PREDICTION_FIELDS.PREDICTED_AWAY_SCORE] as number,
      reward: data[PREDICTION_FIELDS.REWARD] as Prediction['reward'],
      status: data[PREDICTION_FIELDS.STATUS] as Prediction['status'],
      createdAt: data[PREDICTION_FIELDS.CREATED_AT] as string,
    };
  }

  async getPredictionHistory(userId: string): Promise<PredictionHistory> {
    const snapshot = await getDocs(
      query(this.predictionsRef(), where(PREDICTION_FIELDS.USER_ID, '==', userId))
    );

    const predictions = snapshot.docs
      .map((d) => this.toPrediction(d.id, d.data()))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const { successRate, totalPoints } = computePredictionStats(predictions);

    return { predictions, successRate, totalPoints };
  }

  async createPrediction(
    predictionData: Omit<Prediction, 'id' | 'createdAt' | 'status'>
  ): Promise<Prediction> {
    const newPrediction = {
      ...predictionData,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    const ref = await addDoc(this.predictionsRef(), newPrediction);

    return { ...newPrediction, id: ref.id };
  }

  async updatePredictionStatus(
    predictionId: string,
    status: 'won' | 'lost'
  ): Promise<Prediction> {
    const ref = doc(db, COLLECTIONS.PREDICTIONS, predictionId);
    const snap = await getDoc(ref);

    if (!snap.exists()) throw new Error('Palpite não encontrado');

    await updateDoc(ref, { [PREDICTION_FIELDS.STATUS]: status });

    return { ...this.toPrediction(snap.id, snap.data()), status };
  }
}
