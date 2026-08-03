jest.mock('../../../../../shared/infra/sqlite/database', () => ({
  getSQLiteDb: jest.fn(),
}));

import { getSQLiteDb } from '../../../../../shared/infra/sqlite/database';
import { SQLiteAlbumCatalogRepository } from '../../../infra/repositories/SQLiteAlbumCatalogRepository';

const mockDb = {
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (getSQLiteDb as jest.Mock).mockResolvedValue(mockDb);
});

describe('SQLiteAlbumCatalogRepository', () => {
  const sut = new SQLiteAlbumCatalogRepository();

  describe('getAlbumById', () => {
    it('mapeia a linha do banco para a entidade Album', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ id: 'a1', name: 'Copa 2026', total_stickers: 500, price: 10 });

      const album = await sut.getAlbumById('a1');

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith('SELECT * FROM albums WHERE id = ?;', ['a1']);
      expect(album).toEqual({ id: 'a1', name: 'Copa 2026', totalStickers: 500, ownedStickersCount: 0, price: 10 });
    });

    it('lança erro quando o álbum não existe', async () => {
      mockDb.getFirstAsync.mockResolvedValue(undefined);

      await expect(sut.getAlbumById('inexistente')).rejects.toThrow('Album not found: inexistente');
    });
  });

  describe('getMarketAlbums', () => {
    it('mapeia todas as linhas com ownedStickersCount sempre zerado', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { id: 'a1', name: 'Copa 2026', total_stickers: 500, price: 10 },
        { id: 'a2', name: 'Retrô', total_stickers: 100, price: 5 },
      ]);

      const albums = await sut.getMarketAlbums();

      expect(albums).toEqual([
        { id: 'a1', name: 'Copa 2026', totalStickers: 500, ownedStickersCount: 0, price: 10 },
        { id: 'a2', name: 'Retrô', totalStickers: 100, ownedStickersCount: 0, price: 5 },
      ]);
    });
  });

  describe('getStickersByIds', () => {
    it('retorna [] sem consultar o banco quando a lista de ids está vazia', async () => {
      const stickers = await sut.getStickersByIds([]);

      expect(stickers).toEqual([]);
      expect(mockDb.getAllAsync).not.toHaveBeenCalled();
    });

    it('converte player_id/team_id nulos para undefined e faz cast de rarity', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        {
          id: 's1',
          album_id: 'a1',
          player_id: null,
          team_id: null,
          player_name: 'Jogador X',
          price: 20,
          rarity: 'lendaria',
          image_url: 'https://example.com/s1.png',
        },
      ]);

      const [sticker] = await sut.getStickersByIds(['s1']);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM stickers WHERE id IN (?);', ['s1']);
      expect(sticker.playerId).toBeUndefined();
      expect(sticker.teamId).toBeUndefined();
      expect(sticker.rarity).toBe('lendaria');
      expect(sticker.obtainedAt).toBe('');
    });

    it('monta os placeholders IN (?, ?, ...) de acordo com a quantidade de ids', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await sut.getStickersByIds(['s1', 's2', 's3']);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM stickers WHERE id IN (?,?,?);',
        ['s1', 's2', 's3'],
      );
    });
  });

  describe('getStickersByAlbumId', () => {
    it('consulta por album_id e mapeia as linhas', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        {
          id: 's1',
          album_id: 'a1',
          player_id: 'p1',
          team_id: 't1',
          player_name: 'Jogador X',
          price: 20,
          rarity: 'comum',
          image_url: 'https://example.com/s1.png',
        },
      ]);

      const stickers = await sut.getStickersByAlbumId('a1');

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM stickers WHERE album_id = ? ORDER BY id ASC;',
        ['a1'],
      );
      expect(stickers[0].playerId).toBe('p1');
      expect(stickers[0].teamId).toBe('t1');
    });
  });

  describe('getAllStickers', () => {
    it('consulta todas as figurinhas ordenadas por id', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await sut.getAllStickers();

      expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM stickers ORDER BY id ASC;');
    });
  });
});
