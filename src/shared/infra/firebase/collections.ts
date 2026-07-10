/**
 * Constantes dos nomes das coleções/documentos Firestore.
 * Centralizar aqui evita strings mágicas espalhadas pelo código.
 */
export const COLLECTIONS = {
  USERS: 'users',
} as const;

export const USER_FIELDS = {
  COINS: 'coins',
  STICKER_IDS: 'stickerIds',
  PROGRESS: 'progress',
  FAVORITE_TEAM_IDS: 'favoriteTeamIds',
  NAME: 'name',
  EMAIL: 'email',
  CREATED_AT: 'createdAt',
} as const;
