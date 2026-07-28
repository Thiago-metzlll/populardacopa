import { BuyStickerPack } from './BuyStickerPack';
import { AlbumRepository, BuyStickerPackResult } from '../repositories/AlbumRepository';

describe('BuyStickerPack', () => {
  it('delega a compra para o repositório com os argumentos recebidos e retorna o resultado', async () => {
    const expected: BuyStickerPackResult = { packId: 'pack-1', stickers: [] };
    const albumRepository = {
      buyStickerPack: jest.fn(async () => expected),
    } as unknown as AlbumRepository;
    const sut = new BuyStickerPack(albumRepository);

    const result = await sut.execute('user-1', 'album-1', 200);

    expect(albumRepository.buyStickerPack).toHaveBeenCalledWith('user-1', 'album-1', 200);
    expect(result).toBe(expected);
  });
});
