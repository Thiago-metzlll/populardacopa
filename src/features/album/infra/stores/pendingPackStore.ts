import { Sticker } from '../../domain/entities/Sticker';

/**
 * Store em memoria que guarda os stickers ja sorteados por packId.
 * Evita double-draw: buyStickerPack sorteia UMA vez e grava aqui;
 * useAbrirPacote le daqui em vez de chamar openPackage novamente.
 */
const store: Record<string, Sticker[]> = {};

/**
 * Prefixo dos pacotes gratis diarios. Eles ja foram sorteados e cobrados do
 * limite diario no claim, entao nao existe fallback: se o id sumir do store,
 * a tela precisa avisar em vez de chamar openPackage e sortear de novo.
 */
export const FREE_PACK_PREFIX = 'free_';

export const pendingPackStore = {
  set(packId: string, stickers: Sticker[]): void {
    store[packId] = stickers;
  },
  get(packId: string): Sticker[] {
    return store[packId] ?? [];
  },
  has(packId: string): boolean {
    return packId in store;
  },
  clear(packId: string): void {
    delete store[packId];
  },
};
