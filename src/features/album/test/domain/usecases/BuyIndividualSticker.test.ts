import { makeSticker } from '../../../../../../test/fixtures';
import { Album } from '../../../domain/entities/Album';
import { UserCollection } from '../../../domain/entities/UserCollection';
import { AlbumRepository } from '../../../domain/repositories/AlbumRepository';
import { BuyIndividualSticker } from '../../../domain/usecases/BuyIndividualSticker';

const album: Album = { id: 'a1', name: 'Copa 2026', totalStickers: 10, ownedStickersCount: 0 };

const collection = (stickerIds: string[] = []): UserCollection => ({
  userId: 'u1',
  albumId: 'a1',
  stickerIds,
  progress: 0,
});

const FIXED_NOW = '2026-03-15T12:00:00.000Z';

const makeSut = ({ coins = 200, owned = [] as string[], found = [makeSticker({ id: 's7' })] } = {}) => {
  const albumRepository = {
    getStickersByIds: jest.fn().mockResolvedValue(found),
    getUserCoins: jest.fn().mockResolvedValue(coins),
    getUserCollection: jest.fn().mockResolvedValue(collection(owned)),
    getAlbumById: jest.fn().mockResolvedValue(album),
    commitStickerPurchase: jest.fn().mockResolvedValue(undefined),
  } as unknown as AlbumRepository;

  const sut = new BuyIndividualSticker(albumRepository, () => new Date(FIXED_NOW));

  return { sut, albumRepository };
};

describe('BuyIndividualSticker', () => {
  it('recusa quando a figurinha não existe no catálogo, antes de olhar o saldo', async () => {
    const { sut, albumRepository } = makeSut({ found: [] });

    await expect(sut.execute('u1', 'inexistente', 50)).rejects.toThrow('Figurinha não encontrada');

    expect(albumRepository.getUserCoins).not.toHaveBeenCalled();
    expect(albumRepository.commitStickerPurchase).not.toHaveBeenCalled();
  });

  it('recusa quando o saldo não cobre o custo, sem persistir nada', async () => {
    const { sut, albumRepository } = makeSut({ coins: 40 });

    await expect(sut.execute('u1', 's7', 50)).rejects.toThrow('Saldo de moedas insuficiente');

    expect(albumRepository.commitStickerPurchase).not.toHaveBeenCalled();
  });

  it('aceita quando o saldo é exatamente igual ao custo', async () => {
    const { sut, albumRepository } = makeSut({ coins: 50 });

    await sut.execute('u1', 's7', 50);

    expect(albumRepository.commitStickerPurchase).toHaveBeenCalledWith(
      expect.objectContaining({ newBalance: 0 }),
    );
  });

  it('debita o custo e envia ao repositório o resultado já decidido', async () => {
    const { sut, albumRepository } = makeSut({ coins: 200 });

    await sut.execute('u1', 's7', 50);

    expect(albumRepository.commitStickerPurchase).toHaveBeenCalledWith({
      userId: 'u1',
      newBalance: 150,
      newStickerIds: ['s7'],
      progress: 10, // 1 id de 10 totalStickers
      obtainedAt: FIXED_NOW,
    });
  });

  it('devolve a figurinha carimbada com a data da compra', async () => {
    const { sut } = makeSut();

    const bought = await sut.execute('u1', 's7', 50);

    expect(bought.id).toBe('s7');
    expect(bought.obtainedAt).toBe(FIXED_NOW);
  });

  it('não altera o progresso ao recomprar uma figurinha já possuída', async () => {
    const { sut, albumRepository } = makeSut({ owned: ['s7', 's9'] });

    await sut.execute('u1', 's7', 50);

    expect(albumRepository.commitStickerPurchase).toHaveBeenCalledWith(
      expect.objectContaining({ progress: 20 }),
    );
  });

  it('calcula o progresso contra o álbum de referência', async () => {
    const { sut, albumRepository } = makeSut();

    await sut.execute('u1', 's7', 50);

    expect(albumRepository.getAlbumById).toHaveBeenCalledWith('a1');
  });

  it('sem injeção, usa o relógio do sistema', async () => {
    // Exercita o parâmetro default do construtor — o caminho de produção.
    const albumRepository = {
      getStickersByIds: jest.fn().mockResolvedValue([makeSticker({ id: 's7' })]),
      getUserCoins: jest.fn().mockResolvedValue(200),
      getUserCollection: jest.fn().mockResolvedValue(collection()),
      getAlbumById: jest.fn().mockResolvedValue(album),
      commitStickerPurchase: jest.fn().mockResolvedValue(undefined),
    } as unknown as AlbumRepository;

    const bought = await new BuyIndividualSticker(albumRepository).execute('u1', 's7', 50);

    expect(Number.isNaN(Date.parse(bought.obtainedAt))).toBe(false);
  });
});
