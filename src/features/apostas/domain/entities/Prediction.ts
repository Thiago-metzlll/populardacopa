export interface PredictionReward {
  type: 'sticker' | 'coins';
  description: string;
  stickerIds?: string[];
  coinAmount?: number;
}

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  reward: PredictionReward;
  status: 'pending' | 'won' | 'lost';
  createdAt: string;
}
