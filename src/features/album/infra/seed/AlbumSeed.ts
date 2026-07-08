import { Album } from '../../domain/entities/Album';
import { Sticker } from '../../domain/entities/Sticker';
import { UserCollection } from '../../domain/entities/UserCollection';

export const mockAlbums: Album[] = [
  {
    id: 'a1',
    name: 'Álbum da Copa 2026',
    totalStickers: 100,
    ownedStickersCount: 78,
    price: 50,
  },
  {
    id: 'a2',
    name: 'Álbum de Lendas da Copa',
    totalStickers: 50,
    ownedStickersCount: 15,
    price: 80,
  },
];

const generateStickers = (): Sticker[] => {
  const stickers: Sticker[] = [];
  const baseDate = new Date('2026-06-01T10:00:00Z').getTime();

  for (let i = 1; i <= 100; i++) {
    let rarity: 'comum' | 'rara' | 'lendaria' = 'comum';
    if (i % 20 === 0) rarity = 'lendaria';
    else if (i % 5 === 0) rarity = 'rara';

    const obtainedAt = new Date(baseDate + i * 86400000).toISOString(); 

    stickers.push({
      id: `s${i}`,
      playerId: `p${i}`,
      teamId: `t${(i % 10) + 1}`,
      rarity,
      imageUrl: `https://fakeimg.pl/200x300/?text=Sticker+${i}`,
      obtainedAt,
    });
  }
  return stickers;
};

export const mockStickers: Sticker[] = generateStickers();

export const mockUserCollection: UserCollection = {
  userId: 'u1',
  albumId: 'a1',
  stickerIds: mockStickers.slice(0, 78).map(s => s.id),
  progress: 78,
};
