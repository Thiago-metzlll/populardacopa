/**
 * Constantes dos nomes das coleções/documentos Firestore.
 * Centralizar aqui evita strings mágicas espalhadas pelo código.
 */
export const COLLECTIONS = {
  USERS: 'users',
  PREDICTIONS: 'predictions',
} as const;

export const USER_FIELDS = {
  COINS: 'coins',
  STICKER_IDS: 'stickerIds',
  STICKER_OBTAINED_AT: 'stickerObtainedAt',
  PROGRESS: 'progress',
  FAVORITE_TEAM_IDS: 'favoriteTeamIds',
  NAME: 'name',
  EMAIL: 'email',
  CREATED_AT: 'createdAt',
  LAST_DAILY_COINS_CLAIM_AT: 'lastDailyCoinsClaimAt',
  LAST_FREE_PACK_CLAIM_AT: 'lastFreePackClaimAt',
} as const;

/**
 * Palpites ficam numa coleção raiz (não numa subcoleção de `users`) porque
 * `PredictionRepository.updatePredictionStatus(predictionId, status)` não recebe
 * userId — numa subcoleção seria impossível montar a referência do documento.
 */
export const PREDICTION_FIELDS = {
  USER_ID: 'userId',
  MATCH_ID: 'matchId',
  PREDICTED_HOME_SCORE: 'predictedHomeScore',
  PREDICTED_AWAY_SCORE: 'predictedAwayScore',
  REWARD: 'reward',
  STATUS: 'status',
  CREATED_AT: 'createdAt',
} as const;
