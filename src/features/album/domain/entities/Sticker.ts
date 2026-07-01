export interface Sticker {
  id: string;
  playerId?: string;
  teamId?: string;
  rarity: 'comum' | 'rara' | 'lendaria';
  imageUrl: string;
  obtainedAt: string;
}
