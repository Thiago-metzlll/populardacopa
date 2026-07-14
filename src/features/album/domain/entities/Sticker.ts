export interface Sticker {
  id: string;
  albumId: string;
  playerId?: string;
  teamId?: string;
  playerName: string;
  price: number;
  rarity: 'comum' | 'rara' | 'lendaria';
  imageUrl: string;
  obtainedAt: string;
}
