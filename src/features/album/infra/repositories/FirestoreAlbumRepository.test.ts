jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => 'USER_DOC_REF'),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  increment: jest.fn((n: number) => ({ __op: 'increment', n })),
  arrayUnion: jest.fn((...ids: string[]) => ({ __op: 'arrayUnion', ids })),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
}));

jest.mock('../../../../shared/infra/firebase/firebaseConfig', () => ({
  db: {},
}));

import { getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { FirestoreAlbumRepository } from './FirestoreAlbumRepository';
import { SQLiteAlbumCatalogRepository } from './SQLiteAlbumCatalogRepository';
import { Album } from '../../domain/entities/Album';
import { Sticker } from '../../domain/entities/Sticker';

const makeSticker = (id: string, overrides: Partial<Sticker> = {}): Sticker => ({
  id,
  albumId: 'a1',
  playerName: `Jogador ${id}`,
  price: 10,
  rarity: 'comum',
  imageUrl: 'https://example.com/img.png',
  obtainedAt: '',
  ...overrides,
});

const album: Album = { id: 'a1', name: 'Copa 2026', totalStickers: 10, ownedStickersCount: 0, price: 5 };

const makeCatalog = () => ({
  getAlbumById: jest.fn().mockResolvedValue(album),
  getStickersByIds: jest.fn().mockResolvedValue([]),
  getMarketAlbums: jest.fn().mockResolvedValue([]),
  getAllStickers: jest.fn().mockResolvedValue([]),
  getStickersByAlbumId: jest.fn().mockResolvedValue([]),
}) as unknown as jest.Mocked<SQLiteAlbumCatalogRepository>;

const snapshot = (data: Record<string, any> | undefined) => ({
  exists: () => data !== undefined,
  data: () => data,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('FirestoreAlbumRepository', () => {
  describe('getUserCollection / ensureUserDoc', () => {
    it('não recria o documento quando o usuário já existe', async () => {
      const catalog = makeCatalog();
      (getDoc as jest.Mock).mockResolvedValue(snapshot({ stickerIds: ['s1'], stickerObtainedAt: {} }));
      const sut = new FirestoreAlbumRepository(catalog);

      const collection = await sut.getUserCollection('user-1');

      expect(setDoc).not.toHaveBeenCalled();
      expect(collection.progress).toBe(10); // 1 de 10 totalStickers
    });

    it('cria o documento com valores padrão quando o usuário ainda não existe', async () => {
      const catalog = makeCatalog();
      (getDoc as jest.Mock)
        .mockResolvedValueOnce(snapshot(undefined))
        .mockResolvedValue(snapshot({ stickerIds: [], stickerObtainedAt: {} }));
      const sut = new FirestoreAlbumRepository(catalog);

      await sut.getUserCollection('user-1');

      expect(setDoc).toHaveBeenCalledWith(
        'USER_DOC_REF',
        expect.objectContaining({ coins: 200, stickerIds: [], progress: 0 }),
      );
    });
  });

  describe('getUserCoins', () => {
    it('retorna 200 (padrão) quando o campo coins ainda não existe', async () => {
      const catalog = makeCatalog();
      (getDoc as jest.Mock).mockResolvedValue(snapshot({}));
      const sut = new FirestoreAlbumRepository(catalog);

      expect(await sut.getUserCoins('user-1')).toBe(200);
    });
  });

  describe('deductUserCoins', () => {
    it('nunca deixa o saldo ficar negativo', async () => {
      const catalog = makeCatalog();
      (getDoc as jest.Mock).mockResolvedValue(snapshot({ coins: 50 }));
      const sut = new FirestoreAlbumRepository(catalog);

      const newBalance = await sut.deductUserCoins('user-1', 100);

      expect(newBalance).toBe(0);
      expect(updateDoc).toHaveBeenCalledWith('USER_DOC_REF', { coins: 0 });
    });
  });

  describe('claimDailyCoins', () => {
    it('lança erro quando a recompensa diária ainda não está disponível', async () => {
      const catalog = makeCatalog();
      const justClaimed = { toDate: () => new Date() };
      (getDoc as jest.Mock).mockResolvedValue(snapshot({ lastDailyCoinsClaimAt: justClaimed }));
      const sut = new FirestoreAlbumRepository(catalog);

      await expect(sut.claimDailyCoins('user-1')).rejects.toThrow('Recompensa diária ainda não disponível.');
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('credita as moedas e grava o timestamp quando disponível', async () => {
      const catalog = makeCatalog();
      (getDoc as jest.Mock).mockResolvedValue(snapshot({ coins: 200 }));
      const sut = new FirestoreAlbumRepository(catalog);

      const result = await sut.claimDailyCoins('user-1');

      expect(result.amount).toBe(50);
      expect(updateDoc).toHaveBeenCalledWith(
        'USER_DOC_REF',
        expect.objectContaining({
          coins: { __op: 'increment', n: 50 },
          lastDailyCoinsClaimAt: 'SERVER_TIMESTAMP',
        }),
      );
    });
  });

  describe('claimFreePackage', () => {
    it('lança erro quando o pacote grátis ainda não está disponível', async () => {
      const catalog = makeCatalog();
      const justClaimed = { toDate: () => new Date() };
      (getDoc as jest.Mock).mockResolvedValue(snapshot({ lastFreePackClaimAt: justClaimed, stickerIds: [] }));
      const sut = new FirestoreAlbumRepository(catalog);

      await expect(sut.claimFreePackage('user-1')).rejects.toThrow('Pacote grátis ainda não disponível.');
    });

    it('sorteia só entre as figurinhas não possuídas quando disponível', async () => {
      const catalog = makeCatalog();
      catalog.getAllStickers.mockResolvedValue([makeSticker('s1'), makeSticker('s2'), makeSticker('s3')]);
      (getDoc as jest.Mock).mockResolvedValue(snapshot({ stickerIds: ['s1'], stickerObtainedAt: {} }));
      const sut = new FirestoreAlbumRepository(catalog);

      const stickers = await sut.claimFreePackage('user-1');

      expect(stickers.every((s) => s.id !== 's1')).toBe(true);
      expect(updateDoc).toHaveBeenCalledWith(
        'USER_DOC_REF',
        expect.objectContaining({ lastFreePackClaimAt: 'SERVER_TIMESTAMP' }),
      );
    });
  });

  describe('openPackage', () => {
    it('delega para o mesmo sorteio sem repetição do pacote grátis', async () => {
      const catalog = makeCatalog();
      catalog.getAllStickers.mockResolvedValue([makeSticker('s1'), makeSticker('s2')]);
      (getDoc as jest.Mock).mockResolvedValue(snapshot({ stickerIds: [], stickerObtainedAt: {} }));
      const sut = new FirestoreAlbumRepository(catalog);

      const stickers = await sut.openPackage('pkg-1', 'user-1');

      expect(stickers.length).toBeGreaterThan(0);
      expect(stickers.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getMarketAlbums', () => {
    it('cruza a coleção do usuário com o catálogo para calcular ownedStickersCount por álbum', async () => {
      const catalog = makeCatalog();
      catalog.getMarketAlbums.mockResolvedValue([
        { id: 'a1', name: 'Copa 2026', totalStickers: 10, ownedStickersCount: 0 },
        { id: 'a2', name: 'Retrô', totalStickers: 5, ownedStickersCount: 0 },
      ]);
      catalog.getAllStickers.mockResolvedValue([
        makeSticker('s1', { albumId: 'a1' }),
        makeSticker('s2', { albumId: 'a2' }),
      ]);
      (getDoc as jest.Mock).mockResolvedValue(snapshot({ stickerIds: ['s1'], stickerObtainedAt: {} }));
      const sut = new FirestoreAlbumRepository(catalog);

      const albums = await sut.getMarketAlbums('user-1');

      expect(albums.find((a) => a.id === 'a1')?.ownedStickersCount).toBe(1);
      expect(albums.find((a) => a.id === 'a2')?.ownedStickersCount).toBe(0);
    });
  });

  // As regras de compra (saldo, sorteio, progresso) vivem nos use cases
  // BuyStickerPack / BuyIndividualSticker e são testadas lá, sem Firestore.
  // Aqui resta só a persistência: gravar o que chegou pronto, de uma vez.
  describe('commitStickerPurchase', () => {
    it('grava saldo, ids e progresso em uma única escrita', async () => {
      const catalog = makeCatalog();
      (getDoc as jest.Mock).mockResolvedValue(snapshot({ coins: 200, stickerIds: [] }));
      const sut = new FirestoreAlbumRepository(catalog);

      await sut.commitStickerPurchase({
        userId: 'user-1',
        newBalance: 150,
        newStickerIds: ['s1', 's2'],
        progress: 20,
        obtainedAt: '2026-03-15T12:00:00.000Z',
      });

      expect(updateDoc).toHaveBeenCalledTimes(1);
      expect(updateDoc).toHaveBeenCalledWith('USER_DOC_REF', {
        coins: 150,
        stickerIds: { __op: 'arrayUnion', ids: ['s1', 's2'] },
        progress: 20,
        'stickerObtainedAt.s1': '2026-03-15T12:00:00.000Z',
        'stickerObtainedAt.s2': '2026-03-15T12:00:00.000Z',
      });
    });

    it('não decide nada: grava o saldo recebido mesmo que seja maior que o anterior', async () => {
      const catalog = makeCatalog();
      (getDoc as jest.Mock).mockResolvedValue(snapshot({ coins: 10, stickerIds: [] }));
      const sut = new FirestoreAlbumRepository(catalog);

      await sut.commitStickerPurchase({
        userId: 'user-1',
        newBalance: 999,
        newStickerIds: [],
        progress: 0,
        obtainedAt: '2026-03-15T12:00:00.000Z',
      });

      expect(updateDoc).toHaveBeenCalledWith('USER_DOC_REF', expect.objectContaining({ coins: 999 }));
    });

    it('cria o documento do usuário antes de gravar, se ele ainda não existir', async () => {
      const catalog = makeCatalog();
      (getDoc as jest.Mock).mockResolvedValue(snapshot(undefined));
      const sut = new FirestoreAlbumRepository(catalog);

      await sut.commitStickerPurchase({
        userId: 'user-novo',
        newBalance: 150,
        newStickerIds: ['s1'],
        progress: 10,
        obtainedAt: '2026-03-15T12:00:00.000Z',
      });

      expect(setDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('grantStickers', () => {
    it('não grava nada quando todas as figurinhas já são possuídas', async () => {
      const catalog = makeCatalog();
      (getDoc as jest.Mock).mockResolvedValue(snapshot({ stickerIds: ['s1'], stickerObtainedAt: {} }));
      const sut = new FirestoreAlbumRepository(catalog);

      const granted = await sut.grantStickers('user-1', ['s1']);

      expect(granted).toEqual([]);
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('concede só as figurinhas que o usuário ainda não tem', async () => {
      const catalog = makeCatalog();
      catalog.getStickersByIds.mockResolvedValue([makeSticker('s2')]);
      (getDoc as jest.Mock).mockResolvedValue(snapshot({ stickerIds: ['s1'], stickerObtainedAt: {} }));
      const sut = new FirestoreAlbumRepository(catalog);

      const granted = await sut.grantStickers('user-1', ['s1', 's2']);

      expect(catalog.getStickersByIds).toHaveBeenCalledWith(['s2']);
      expect(granted.map((s) => s.id)).toEqual(['s2']);
    });
  });
});
