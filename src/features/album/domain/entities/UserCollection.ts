export interface UserCollection {
  userId: string;
  albumId: string;
  stickerIds: string[];
  /** Data ISO de obtenção por sticker ID, quando disponível. */
  stickerObtainedAt?: Record<string, string>;
  progress: number;
}
