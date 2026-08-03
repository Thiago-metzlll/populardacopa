import { makeSticker } from '../../../../../../test/fixtures';
import { AlbumRepository, ClaimDailyCoinsResult } from '../../../domain/repositories/AlbumRepository';
import { Album } from '../../../domain/entities/Album';
import { UserCollection } from '../../../domain/entities/UserCollection';
import { AddUserCoins } from '../../../domain/usecases/AddUserCoins';
import { ClaimDailyCoins } from '../../../domain/usecases/ClaimDailyCoins';
import { ClaimFreePackage } from '../../../domain/usecases/ClaimFreePackage';
import { GetAlbumById } from '../../../domain/usecases/GetAlbumById';
import { GetAlbumStickers } from '../../../domain/usecases/GetAlbumStickers';
import { GetAllStickers } from '../../../domain/usecases/GetAllStickers';
import { GetDailyCoinsStatus } from '../../../domain/usecases/GetDailyCoinsStatus';
import { GetFreePackStatus } from '../../../domain/usecases/GetFreePackStatus';
import { GetMarketAlbums } from '../../../domain/usecases/GetMarketAlbums';
import { GetStickersByIds } from '../../../domain/usecases/GetStickersByIds';
import { GetUserCoins } from '../../../domain/usecases/GetUserCoins';
import { GetUserCollection } from '../../../domain/usecases/GetUserCollection';
import { GrantStickers } from '../../../domain/usecases/GrantStickers';
import { OpenPackage } from '../../../domain/usecases/OpenPackage';

/**
 * Estes use cases só delegam para o AlbumRepository — a lógica de negócio
 * real (SQLite/Firestore, cálculo de cooldown) já é coberta pelos testes do
 * repositório e das constantes de rewards. Aqui garantimos apenas que os
 * argumentos certos chegam ao método certo do repositório, e que o retorno
 * passa direto sem transformação.
 *
 * As compras (BuyStickerPack / BuyIndividualSticker) saíram desta suíte: elas
 * deixaram de delegar e passaram a conter as regras, então ganharam arquivo
 * próprio com testes de comportamento.
 */
const makeRepository = (overrides: Partial<AlbumRepository> = {}): AlbumRepository =>
  ({
    getUserCollection: jest.fn(),
    getAlbumById: jest.fn(),
    getStickersByIds: jest.fn(),
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
    ...overrides,
  }) as unknown as AlbumRepository;

const album: Album = { id: 'a1', name: 'Copa 2026', totalStickers: 100, ownedStickersCount: 0 };
const collection: UserCollection = { userId: 'u1', albumId: 'a1', stickerIds: ['s1'], progress: 1 };

describe('AddUserCoins', () => {
  it('delega para albumRepository.addUserCoins e devolve o novo saldo', async () => {
    const repository = makeRepository({ addUserCoins: jest.fn().mockResolvedValue(150) });

    const result = await new AddUserCoins(repository).execute('u1', 50);

    expect(repository.addUserCoins).toHaveBeenCalledWith('u1', 50);
    expect(result).toBe(150);
  });
});

describe('ClaimDailyCoins', () => {
  it('delega para albumRepository.claimDailyCoins com o userId', async () => {
    const expected: ClaimDailyCoinsResult = { coins: 250, amount: 50 };
    const repository = makeRepository({ claimDailyCoins: jest.fn().mockResolvedValue(expected) });

    const result = await new ClaimDailyCoins(repository).execute('u1');

    expect(repository.claimDailyCoins).toHaveBeenCalledWith('u1');
    expect(result).toBe(expected);
  });
});

describe('ClaimFreePackage', () => {
  it('delega para albumRepository.claimFreePackage e devolve as figurinhas', async () => {
    const stickers = [makeSticker({ id: 's1' }), makeSticker({ id: 's2' })];
    const repository = makeRepository({ claimFreePackage: jest.fn().mockResolvedValue(stickers) });

    const result = await new ClaimFreePackage(repository).execute('u1');

    expect(repository.claimFreePackage).toHaveBeenCalledWith('u1');
    expect(result).toBe(stickers);
  });
});

describe('GetAlbumById', () => {
  it('delega para albumRepository.getAlbumById com o id', async () => {
    const repository = makeRepository({ getAlbumById: jest.fn().mockResolvedValue(album) });

    const result = await new GetAlbumById(repository).execute('a1');

    expect(repository.getAlbumById).toHaveBeenCalledWith('a1');
    expect(result).toBe(album);
  });
});

describe('GetAlbumStickers', () => {
  it('delega para albumRepository.getStickersByAlbumId com o albumId', async () => {
    const stickers = [makeSticker({ id: 's1' })];
    const repository = makeRepository({ getStickersByAlbumId: jest.fn().mockResolvedValue(stickers) });

    const result = await new GetAlbumStickers(repository).execute('a1');

    expect(repository.getStickersByAlbumId).toHaveBeenCalledWith('a1');
    expect(result).toBe(stickers);
  });
});

describe('GetAllStickers', () => {
  it('delega para albumRepository.getAllStickers sem argumentos', async () => {
    const stickers = [makeSticker({ id: 's1' })];
    const repository = makeRepository({ getAllStickers: jest.fn().mockResolvedValue(stickers) });

    const result = await new GetAllStickers(repository).execute();

    expect(repository.getAllStickers).toHaveBeenCalledWith();
    expect(result).toBe(stickers);
  });
});

describe('GetDailyCoinsStatus', () => {
  it('delega para albumRepository.getDailyCoinsStatus com o userId', async () => {
    const status = { available: true, nextAvailableAt: null, amount: 50 };
    const repository = makeRepository({ getDailyCoinsStatus: jest.fn().mockResolvedValue(status) });

    const result = await new GetDailyCoinsStatus(repository).execute('u1');

    expect(repository.getDailyCoinsStatus).toHaveBeenCalledWith('u1');
    expect(result).toBe(status);
  });
});

describe('GetFreePackStatus', () => {
  it('delega para albumRepository.getFreePackStatus com o userId', async () => {
    const status = { available: false, nextAvailableAt: '2026-07-30T12:00:00.000Z' };
    const repository = makeRepository({ getFreePackStatus: jest.fn().mockResolvedValue(status) });

    const result = await new GetFreePackStatus(repository).execute('u1');

    expect(repository.getFreePackStatus).toHaveBeenCalledWith('u1');
    expect(result).toBe(status);
  });
});

describe('GetMarketAlbums', () => {
  it('delega para albumRepository.getMarketAlbums com o userId', async () => {
    const albums = [album];
    const repository = makeRepository({ getMarketAlbums: jest.fn().mockResolvedValue(albums) });

    const result = await new GetMarketAlbums(repository).execute('u1');

    expect(repository.getMarketAlbums).toHaveBeenCalledWith('u1');
    expect(result).toBe(albums);
  });
});

describe('GetStickersByIds', () => {
  it('delega para albumRepository.getStickersByIds com a lista de ids', async () => {
    const stickers = [makeSticker({ id: 's1' })];
    const repository = makeRepository({ getStickersByIds: jest.fn().mockResolvedValue(stickers) });

    const result = await new GetStickersByIds(repository).execute(['s1']);

    expect(repository.getStickersByIds).toHaveBeenCalledWith(['s1']);
    expect(result).toBe(stickers);
  });
});

describe('GetUserCoins', () => {
  it('delega para albumRepository.getUserCoins com o userId', async () => {
    const repository = makeRepository({ getUserCoins: jest.fn().mockResolvedValue(300) });

    const result = await new GetUserCoins(repository).execute('u1');

    expect(repository.getUserCoins).toHaveBeenCalledWith('u1');
    expect(result).toBe(300);
  });
});

describe('GetUserCollection', () => {
  it('delega para albumRepository.getUserCollection com o userId', async () => {
    const repository = makeRepository({ getUserCollection: jest.fn().mockResolvedValue(collection) });

    const result = await new GetUserCollection(repository).execute('u1');

    expect(repository.getUserCollection).toHaveBeenCalledWith('u1');
    expect(result).toBe(collection);
  });
});

describe('GrantStickers', () => {
  it('delega para albumRepository.grantStickers com userId e a lista de ids', async () => {
    const stickers = [makeSticker({ id: 's1' })];
    const repository = makeRepository({ grantStickers: jest.fn().mockResolvedValue(stickers) });

    const result = await new GrantStickers(repository).execute('u1', ['s1']);

    expect(repository.grantStickers).toHaveBeenCalledWith('u1', ['s1']);
    expect(result).toBe(stickers);
  });
});

describe('OpenPackage', () => {
  it('delega para albumRepository.openPackage com packageId e userId, nessa ordem', async () => {
    const stickers = [makeSticker({ id: 's1' }), makeSticker({ id: 's2' }), makeSticker({ id: 's3' })];
    const repository = makeRepository({ openPackage: jest.fn().mockResolvedValue(stickers) });

    const result = await new OpenPackage(repository).execute('pack-1', 'u1');

    expect(repository.openPackage).toHaveBeenCalledWith('pack-1', 'u1');
    expect(result).toBe(stickers);
  });
});
