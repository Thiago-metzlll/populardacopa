import { PredictionHistory } from '../../domain/entities/PredictionHistory';
import { Prediction } from '../../domain/entities/Prediction';

export const mockPredictions: Prediction[] = [
  {
    id: 'pred_1',
    userId: 'u1',
    matchId: 'm1',
    predictedHomeScore: 2,
    predictedAwayScore: 0,
    reward: { type: 'coins', description: '+50 moedas', coinAmount: 50 },
    status: 'won',
    createdAt: '2026-06-15T14:00:00Z',
  },
  {
    id: 'pred_2',
    userId: 'u1',
    matchId: 'm2',
    predictedHomeScore: 1,
    predictedAwayScore: 1,
    reward: { type: 'sticker', description: '1 figurinha rara', stickerIds: ['s3'] },
    status: 'lost',
    createdAt: '2026-06-16T17:00:00Z',
  },
  {
    id: 'pred_3',
    userId: 'u1',
    matchId: 'm3',
    predictedHomeScore: 3,
    predictedAwayScore: 1,
    reward: { type: 'coins', description: '+100 moedas', coinAmount: 100 },
    status: 'won',
    createdAt: '2026-06-18T20:00:00Z',
  },
  {
    id: 'pred_4',
    userId: 'u1',
    matchId: 'm4',
    predictedHomeScore: 0,
    predictedAwayScore: 2,
    reward: { type: 'coins', description: '+50 moedas', coinAmount: 50 },
    status: 'lost',
    createdAt: '2026-06-20T14:00:00Z',
  },
  {
    id: 'pred_5',
    userId: 'u1',
    matchId: 'm5',
    predictedHomeScore: 1,
    predictedAwayScore: 0,
    reward: { type: 'sticker', description: '1 figurinha lendária', stickerIds: ['s6'] },
    status: 'won',
    createdAt: '2026-06-22T18:00:00Z',
  },
  {
    id: 'pred_6',
    userId: 'u1',
    matchId: 'm6',
    predictedHomeScore: 2,
    predictedAwayScore: 2,
    reward: { type: 'coins', description: '+75 moedas', coinAmount: 75 },
    status: 'lost',
    createdAt: '2026-06-25T21:00:00Z',
  },
  {
    id: 'pred_7',
    userId: 'u1',
    matchId: 'm7',
    predictedHomeScore: 2,
    predictedAwayScore: 1,
    reward: { type: 'coins', description: '+150 moedas', coinAmount: 150 },
    status: 'pending',
    createdAt: '2026-07-01T19:00:00Z',
  },
  {
    id: 'pred_8',
    userId: 'u1',
    matchId: 'm8',
    predictedHomeScore: 0,
    predictedAwayScore: 1,
    reward: { type: 'sticker', description: '2 figurinhas raras', stickerIds: ['s2', 's5'] },
    status: 'pending',
    createdAt: '2026-07-05T21:00:00Z',
  },
  {
    id: 'pred_9',
    userId: 'u1',
    matchId: 'm9',
    predictedHomeScore: 2,
    predictedAwayScore: 1,
    reward: { type: 'coins', description: '+80 moedas', coinAmount: 80 },
    status: 'pending',
    createdAt: '2026-07-18T21:00:00Z',
  },
];

const wonPredictions = mockPredictions.filter(p => p.status === 'won');
const successRate = Math.round((wonPredictions.length / mockPredictions.filter(p => p.status !== 'pending').length) * 100);

export const mockPredictionHistory: PredictionHistory = {
  predictions: mockPredictions,
  totalPoints: wonPredictions.reduce((acc, p) => acc + (p.reward.coinAmount || 0), 0),
  successRate,
};

