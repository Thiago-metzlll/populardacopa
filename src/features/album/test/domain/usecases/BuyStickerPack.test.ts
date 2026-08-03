import { makeSticker } from '../../../../../../test/fixtures';
import { PACK_SIZE } from '../../../domain/constants/collection';
import { Album } from '../../../domain/entities/Album';
import { UserCollection } from '../../../domain/entities/UserCollection';
import { AlbumRepository } from '../../../domain/repositories/AlbumRepository';
import { BuyStickerPack } from '../../../domain/usecases/BuyStickerPack';

const album: Album = { id: 'a1', name: 'Copa 2026', totalStickers: 10, ownedStickersCount: 0 };

const collection = (stickerIds: string[] = []): UserCollection => ({
  userId: 'u1',
  albumId: 'a1',
  stickerIds,
  progress: 0,
});

const pool = [makeSticker({ id: 's1' }), makeSticker({ id: 's2' }), makeSticker({ id: 's3' })];

const FIXED_NOW = '2026-03-15T12:00:00.000Z';

const makeSut = ({
  coins = 200,
  owned = [] as string[],
  random = (() => 0) as () => number,
} = {}) => {
  const albumRepository = {
    getUserCoins: jest.fn().mockResolvedValue(coins),
    getAllStickers: jest.fn().mockResolvedValue(pool),
    getUserCollection: jest.fn().mockResolvedValue(collection(owned)),
    getAlbumById: jest.fn().mockResolvedValue(album),
    commitStickerPurchase: jest.fn().mockResolvedValue(undefined),
  } as unknown as AlbumRepository;

  // Sorteio e relógio fixos: a compra inteira vira determinística.
  const sut = new BuyStickerPack(albumRepository, random, () => new Date(FIXED_NOW));

  return { sut, albumRepository };
};

describe('BuyStickerPack', () => {
  it('recusa a compra quando o saldo não cobre o custo, sem persistir nada', async () => {
    const { sut, albumRepository } = makeSut({ coins: 40 });

    await expect(sut.execute('u1', 'a1', 50)).rejects.toThrow('Saldo de moedas insuficiente');

    expect(albumRepository.commitStickerPurchase).not.toHaveBeenCalled();
  });

  it('aceita a compra quando o saldo é exatamente igual ao custo', async () => {
    const { sut, albumRepository } = makeSut({ coins: 50 });

    await sut.execute('u1', 'a1', 50);

    expect(albumRepository.commitStickerPurchase).toHaveBeenCalledWith(
      expect.objectContaining({ newBalance: 0 }),
    );
  });

  it(`sorteia PACK_SIZE (${PACK_SIZE}) figurinhas e carimba obtainedAt em todas`, async () => {
    const { sut } = makeSut();

    const result = await sut.execute('u1', 'a1', 50);

    expect(result.stickers).toHaveLength(PACK_SIZE);
    expect(result.stickers.every((s) => s.obtainedAt === FIXED_NOW)).toBe(true);
  });

  it('debita o custo e envia ao repositório o resultado já decidido', async () => {
    const { sut, albumRepository } = makeSut({ coins: 200 });

    await sut.execute('u1', 'a1', 50);

    expect(albumRepository.commitStickerPurchase).toHaveBeenCalledWith({
      userId: 'u1',
      newBalance: 150,
      newStickerIds: ['s1'], // random () => 0 sorteia sempre o primeiro do pool
      progress: 10, // 1 id único de 10 totalStickers
      obtainedAt: FIXED_NOW,
    });
  });

  it('não conta figurinha repetida duas vezes no progresso', async () => {
    // sorteia s1, s2, s1 — o pacote tem 3 cartas, mas só 2 ids novos
    const sequence = [0, 0.4, 0];
    let call = 0;
    const { sut, albumRepository } = makeSut({ random: () => sequence[call++] });

    const result = await sut.execute('u1', 'a1', 50);

    expect(result.stickers.map((s) => s.id)).toEqual(['s1', 's2', 's1']);
    expect(albumRepository.commitStickerPurchase).toHaveBeenCalledWith(
      expect.objectContaining({ newStickerIds: ['s1', 's2'], progress: 20 }),
    );
  });

  it('não recontabiliza figurinha que o usuário já possuía', async () => {
    const { sut, albumRepository } = makeSut({ owned: ['s1', 's7'] });

    // s1 sai no sorteio, mas já era possuída: o progresso continua 2 de 10.
    await sut.execute('u1', 'a1', 50);

    expect(albumRepository.commitStickerPurchase).toHaveBeenCalledWith(
      expect.objectContaining({ progress: 20 }),
    );
  });

  it('calcula o progresso contra o álbum de referência, não contra o álbum comprado', async () => {
    const { sut, albumRepository } = makeSut();

    await sut.execute('u1', 'album-de-outra-copa', 50);

    expect(albumRepository.getAlbumById).toHaveBeenCalledWith('a1');
  });

  it('devolve um packId derivado do relógio injetado', async () => {
    const { sut } = makeSut();

    const result = await sut.execute('u1', 'a1', 50);

    expect(result.packId).toBe(`pkg_${new Date(FIXED_NOW).getTime()}`);
  });

  it('sem injeção, usa Math.random e o relógio do sistema', async () => {
    // Exercita os parâmetros default do construtor — o caminho que roda em
    // produção. Só dá para afirmar a forma do resultado, não o conteúdo.
    const albumRepository = {
      getUserCoins: jest.fn().mockResolvedValue(200),
      getAllStickers: jest.fn().mockResolvedValue(pool),
      getUserCollection: jest.fn().mockResolvedValue(collection()),
      getAlbumById: jest.fn().mockResolvedValue(album),
      commitStickerPurchase: jest.fn().mockResolvedValue(undefined),
    } as unknown as AlbumRepository;

    const result = await new BuyStickerPack(albumRepository).execute('u1', 'a1', 50);

    expect(result.stickers).toHaveLength(PACK_SIZE);
    expect(result.packId).toMatch(/^pkg_\d+$/);
    expect(Number.isNaN(Date.parse(result.stickers[0].obtainedAt))).toBe(false);
  });
});
