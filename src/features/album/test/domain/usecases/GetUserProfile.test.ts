import { GetUserProfile } from '../../../domain/usecases/GetUserProfile';
import { AlbumRepository } from '../../../domain/repositories/AlbumRepository';
import { Sticker } from '../../../domain/entities/Sticker';
import { UserCollection } from '../../../domain/entities/UserCollection';

const makeSticker = (overrides: Partial<Sticker>): Sticker => ({
  id: 'default',
  albumId: 'album-1',
  playerName: 'Jogador',
  price: 10,
  rarity: 'comum',
  imageUrl: 'https://example.com/img.png',
  obtainedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const makeSut = (collection: UserCollection, catalogStickers: Sticker[]) => {
  const albumRepository: AlbumRepository = {
    getUserCollection: jest.fn(async () => collection),
    getAlbumById: jest.fn(),
    getStickersByIds: jest.fn(async () => catalogStickers),
    openPackage: jest.fn(),
    getMarketAlbums: jest.fn(),
    getUserCoins: jest.fn(),
    deductUserCoins: jest.fn(),
    addUserCoins: jest.fn(),
    getDailyCoinsStatus: jest.fn(),
    claimDailyCoins: jest.fn(),
    getFreePackStatus: jest.fn(),
    claimFreePackage: jest.fn(),
    grantStickers: jest.fn(),
    getStickersByAlbumId: jest.fn(),
    getAllStickers: jest.fn(),
    commitStickerPurchase: jest.fn(),
  };

  return { sut: new GetUserProfile(albumRepository), albumRepository };
};

describe('GetUserProfile', () => {
  it('usa a data de obtenção por usuário quando disponível, com fallback pro catálogo', async () => {
    const collection: UserCollection = {
      userId: 'user-1',
      albumId: 'album-1',
      stickerIds: ['s1', 's2'],
      stickerObtainedAt: { s1: '2026-07-20T00:00:00.000Z' },
      progress: 50,
    };
    const catalogStickers = [
      makeSticker({ id: 's1', obtainedAt: '2000-01-01T00:00:00.000Z' }),
      makeSticker({ id: 's2', obtainedAt: '2026-07-15T00:00:00.000Z' }),
    ];
    const { sut } = makeSut(collection, catalogStickers);

    const result = await sut.execute('user-1');

    expect(result.stickers.find((s) => s.id === 's1')?.obtainedAt).toBe('2026-07-20T00:00:00.000Z');
    expect(result.stickers.find((s) => s.id === 's2')?.obtainedAt).toBe('2026-07-15T00:00:00.000Z');
  });

  it('ordena recentStickers por data de obtenção, mais recente primeiro (stickers preserva a ordem do catálogo)', async () => {
    const collection: UserCollection = {
      userId: 'user-1',
      albumId: 'album-1',
      stickerIds: ['old', 'new', 'mid'],
      progress: 100,
    };
    const catalogStickers = [
      makeSticker({ id: 'old', obtainedAt: '2026-01-01T00:00:00.000Z' }),
      makeSticker({ id: 'new', obtainedAt: '2026-07-20T00:00:00.000Z' }),
      makeSticker({ id: 'mid', obtainedAt: '2026-03-01T00:00:00.000Z' }),
    ];
    const { sut } = makeSut(collection, catalogStickers);

    const result = await sut.execute('user-1');

    expect(result.recentStickers.map((s) => s.id)).toEqual(['new', 'mid', 'old']);
    expect(result.stickers.map((s) => s.id)).toEqual(['old', 'new', 'mid']);
  });

  it('filtra apenas raras e lendárias em rareStickers', async () => {
    const collection: UserCollection = {
      userId: 'user-1',
      albumId: 'album-1',
      stickerIds: ['comum', 'rara', 'lendaria'],
      progress: 100,
    };
    const catalogStickers = [
      makeSticker({ id: 'comum', rarity: 'comum' }),
      makeSticker({ id: 'rara', rarity: 'rara' }),
      makeSticker({ id: 'lendaria', rarity: 'lendaria' }),
    ];
    const { sut } = makeSut(collection, catalogStickers);

    const result = await sut.execute('user-1');

    expect(result.rareStickers.map((s) => s.id).sort()).toEqual(['lendaria', 'rara']);
  });

  it('corta recentStickers nos 10 mais recentes', async () => {
    const stickerIds = Array.from({ length: 15 }, (_, i) => `s${i}`);
    const collection: UserCollection = {
      userId: 'user-1',
      albumId: 'album-1',
      stickerIds,
      progress: 100,
    };
    const catalogStickers = stickerIds.map((id, i) =>
      makeSticker({ id, obtainedAt: new Date(2026, 0, i + 1).toISOString() }),
    );
    const { sut } = makeSut(collection, catalogStickers);

    const result = await sut.execute('user-1');

    expect(result.recentStickers).toHaveLength(10);
    expect(result.stickers).toHaveLength(15);
  });
});
