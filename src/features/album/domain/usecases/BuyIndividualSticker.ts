import { REFERENCE_ALBUM_ID, computeCollectionProgress } from '../constants/collection';
import { Sticker } from '../entities/Sticker';
import { AlbumRepository } from '../repositories/AlbumRepository';

/**
 * Compra avulsa de uma figurinha escolhida pelo usuário.
 *
 * Mesmas regras de compra do pacote — a figurinha precisa existir, o saldo
 * precisa cobrir o custo, o progresso é recalculado — só que sem sorteio.
 * O repositório recebe o resultado pronto e grava numa escrita só.
 */
export class BuyIndividualSticker {
  constructor(
    private readonly albumRepository: AlbumRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(userId: string, stickerId: string, cost: number): Promise<Sticker> {
    const [sticker] = await this.albumRepository.getStickersByIds([stickerId]);
    if (!sticker) throw new Error('Figurinha não encontrada');

    const coins = await this.albumRepository.getUserCoins(userId);
    if (coins < cost) throw new Error('Saldo de moedas insuficiente');

    const obtainedAt = this.now().toISOString();

    const [collection, album] = await Promise.all([
      this.albumRepository.getUserCollection(userId),
      this.albumRepository.getAlbumById(REFERENCE_ALBUM_ID),
    ]);
    const updatedIds = [...new Set([...collection.stickerIds, stickerId])];

    await this.albumRepository.commitStickerPurchase({
      userId,
      newBalance: coins - cost,
      newStickerIds: [stickerId],
      progress: computeCollectionProgress(updatedIds.length, album.totalStickers),
      obtainedAt,
    });

    return { ...sticker, obtainedAt };
  }
}
