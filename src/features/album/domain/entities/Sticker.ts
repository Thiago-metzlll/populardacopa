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
  /**
   * Só é preenchido no momento do sorteio (abertura de pacote), onde se sabe se
   * a figurinha já estava na coleção do usuário. Fora desse fluxo — catálogo,
   * mercado, álbum — fica `undefined` e a UI não mostra o selo nova/repetida.
   */
  isNew?: boolean;
}
