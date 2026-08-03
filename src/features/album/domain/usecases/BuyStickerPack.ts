import {
  PACK_SIZE,
  REFERENCE_ALBUM_ID,
  computeCollectionProgress,
  drawStickersWithRepetition,
} from '../constants/collection';
import { Sticker } from '../entities/Sticker';
import { AlbumRepository, BuyStickerPackResult } from '../repositories/AlbumRepository';

/**
 * Compra de um pacote de figurinhas.
 *
 * Todas as regras da operação vivem aqui: recusar por saldo insuficiente,
 * sortear PACK_SIZE figurinhas (com repetição), debitar o custo e recalcular o
 * progresso. Ao repositório cabe apenas gravar o resultado já decidido.
 *
 * `random` e `now` são injetáveis para tornar a compra determinística em teste
 * — mesmo padrão das funções puras em domain/constants.
 */
export class BuyStickerPack {
  constructor(
    private readonly albumRepository: AlbumRepository,
    private readonly random: () => number = Math.random,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(userId: string, albumId: string, cost: number): Promise<BuyStickerPackResult> {
    const coins = await this.albumRepository.getUserCoins(userId);
    if (coins < cost) throw new Error('Saldo de moedas insuficiente');

    const pool = await this.albumRepository.getAllStickers();
    const drawnAt = this.now();
    const obtainedAt = drawnAt.toISOString();
    const drawn: Sticker[] = drawStickersWithRepetition(pool, PACK_SIZE, this.random).map((sticker) => ({
      ...sticker,
      obtainedAt,
    }));

    // O sorteio permite repetição, mas a coleção guarda ids únicos.
    const drawnIds = [...new Set(drawn.map((sticker) => sticker.id))];

    const [collection, album] = await Promise.all([
      this.albumRepository.getUserCollection(userId),
      this.albumRepository.getAlbumById(REFERENCE_ALBUM_ID),
    ]);
    const updatedIds = [...new Set([...collection.stickerIds, ...drawnIds])];

    await this.albumRepository.commitStickerPurchase({
      userId,
      newBalance: coins - cost,
      newStickerIds: drawnIds,
      progress: computeCollectionProgress(updatedIds.length, album.totalStickers),
      obtainedAt,
    });

    return { packId: `pkg_${drawnAt.getTime()}`, stickers: drawn };
  }
}
