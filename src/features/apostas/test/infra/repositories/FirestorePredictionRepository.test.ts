jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'PREDICTIONS_COLLECTION_REF'),
  doc: jest.fn((_db: unknown, _col: string, id: string) => `DOC_REF:${id}`),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn((ref: unknown, ...constraints: unknown[]) => ({ ref, constraints })),
  where: jest.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
}));

jest.mock('../../../../../shared/infra/firebase/firebaseConfig', () => ({
  db: {},
}));

import { addDoc, doc, getDoc, getDocs, updateDoc, where } from 'firebase/firestore';
import { Prediction } from '../../../domain/entities/Prediction';
import { FirestorePredictionRepository } from '../../../infra/repositories/FirestorePredictionRepository';

type PredictionDoc = Omit<Prediction, 'id'>;

const makeDoc = (id: string, data: Partial<PredictionDoc> = {}) => ({
  id,
  data: () => ({
    userId: 'u1',
    matchId: 'm1',
    predictedHomeScore: 2,
    predictedAwayScore: 1,
    reward: { type: 'coins', description: '+50 moedas', coinAmount: 50 },
    status: 'pending',
    createdAt: '2026-07-01T19:00:00Z',
    ...data,
  }),
});

const querySnapshot = (docs: ReturnType<typeof makeDoc>[]) => ({ docs });

const snapshot = (data: PredictionDoc | undefined, id = 'pred_1') => ({
  id,
  exists: () => data !== undefined,
  data: () => data,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('FirestorePredictionRepository', () => {
  describe('getPredictionHistory', () => {
    it('filtra os palpites pelo userId recebido', async () => {
      (getDocs as jest.Mock).mockResolvedValue(querySnapshot([]));
      const sut = new FirestorePredictionRepository();

      await sut.getPredictionHistory('u42');

      expect(where).toHaveBeenCalledWith('userId', '==', 'u42');
    });

    it('mapeia cada documento para a entidade Prediction, usando o id do doc', async () => {
      (getDocs as jest.Mock).mockResolvedValue(
        querySnapshot([makeDoc('abc123', { matchId: 'm9', status: 'won' })])
      );
      const sut = new FirestorePredictionRepository();

      const { predictions } = await sut.getPredictionHistory('u1');

      expect(predictions).toHaveLength(1);
      expect(predictions[0]).toEqual({
        id: 'abc123',
        userId: 'u1',
        matchId: 'm9',
        predictedHomeScore: 2,
        predictedAwayScore: 1,
        reward: { type: 'coins', description: '+50 moedas', coinAmount: 50 },
        status: 'won',
        createdAt: '2026-07-01T19:00:00Z',
      });
    });

    it('ordena do mais recente para o mais antigo no cliente', async () => {
      (getDocs as jest.Mock).mockResolvedValue(
        querySnapshot([
          makeDoc('antigo', { createdAt: '2026-06-01T10:00:00Z' }),
          makeDoc('novo', { createdAt: '2026-07-20T10:00:00Z' }),
          makeDoc('meio', { createdAt: '2026-07-01T10:00:00Z' }),
        ])
      );
      const sut = new FirestorePredictionRepository();

      const { predictions } = await sut.getPredictionHistory('u1');

      expect(predictions.map((p) => p.id)).toEqual(['novo', 'meio', 'antigo']);
    });

    it('calcula successRate e totalPoints só sobre os palpites resolvidos', async () => {
      (getDocs as jest.Mock).mockResolvedValue(
        querySnapshot([
          makeDoc('p1', { status: 'won' }),
          makeDoc('p2', { status: 'lost' }),
          makeDoc('p3', { status: 'pending' }),
        ])
      );
      const sut = new FirestorePredictionRepository();

      const history = await sut.getPredictionHistory('u1');

      expect(history.successRate).toBe(50); // 1 vitória em 2 resolvidos
      expect(history.totalPoints).toBe(50); // só a vencedora soma
    });

    it('devolve histórico vazio e zerado quando o usuário nunca palpitou', async () => {
      (getDocs as jest.Mock).mockResolvedValue(querySnapshot([]));
      const sut = new FirestorePredictionRepository();

      const history = await sut.getPredictionHistory('novato');

      expect(history).toEqual({ predictions: [], successRate: 0, totalPoints: 0 });
    });
  });

  describe('createPrediction', () => {
    it('grava o palpite como pending e devolve o id gerado pelo Firestore', async () => {
      (addDoc as jest.Mock).mockResolvedValue({ id: 'gerado-pelo-firestore' });
      const sut = new FirestorePredictionRepository();

      const created = await sut.createPrediction({
        userId: 'u1',
        matchId: 'm1',
        predictedHomeScore: 3,
        predictedAwayScore: 0,
        reward: { type: 'coins', description: '+50 moedas', coinAmount: 50 },
      });

      expect(addDoc).toHaveBeenCalledWith(
        'PREDICTIONS_COLLECTION_REF',
        expect.objectContaining({ userId: 'u1', matchId: 'm1', status: 'pending' })
      );
      expect(created.id).toBe('gerado-pelo-firestore');
      expect(created.status).toBe('pending');
    });

    it('carimba createdAt em ISO no momento da criação', async () => {
      (addDoc as jest.Mock).mockResolvedValue({ id: 'x' });
      const sut = new FirestorePredictionRepository();

      const created = await sut.createPrediction({
        userId: 'u1',
        matchId: 'm1',
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        reward: { type: 'coins', description: '+50 moedas', coinAmount: 50 },
      });

      expect(new Date(created.createdAt).toISOString()).toBe(created.createdAt);
    });
  });

  describe('updatePredictionStatus', () => {
    it('lança erro quando o palpite não existe, sem gravar nada', async () => {
      (getDoc as jest.Mock).mockResolvedValue(snapshot(undefined));
      const sut = new FirestorePredictionRepository();

      await expect(sut.updatePredictionStatus('sumiu', 'won')).rejects.toThrow(
        'Palpite não encontrado'
      );
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('grava só o campo status e devolve o palpite já atualizado', async () => {
      (getDoc as jest.Mock).mockResolvedValue(
        snapshot(
          {
            userId: 'u1',
            matchId: 'm9',
            predictedHomeScore: 2,
            predictedAwayScore: 1,
            reward: { type: 'coins', description: '+80 moedas', coinAmount: 80 },
            status: 'pending',
            createdAt: '2026-07-18T21:00:00Z',
          },
          'pred_9'
        )
      );
      const sut = new FirestorePredictionRepository();

      const updated = await sut.updatePredictionStatus('pred_9', 'won');

      expect(doc).toHaveBeenCalledWith({}, 'predictions', 'pred_9');
      expect(updateDoc).toHaveBeenCalledWith('DOC_REF:pred_9', { status: 'won' });
      expect(updated.status).toBe('won');
      expect(updated.id).toBe('pred_9');
      expect(updated.matchId).toBe('m9');
    });
  });
});
