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

const LEGENDARY_NAMES = ['Pelé', 'Diego Maradona', 'Zinedine Zidane', 'Ronaldo Fenômeno', 'Zico'];
const RARE_NAMES = ['Neymar Jr', 'Kylian Mbappé', 'Lionel Messi', 'Cristiano Ronaldo', 'Luka Modrić', 'Karim Benzema', 'Kevin De Bruyne', 'Vinícius Jr.'];

const RARITY_PRICE: Record<Sticker['rarity'], number> = {
  comum: 20,
  rara: 60,
  lendaria: 150,
};

const generateStickers = (albumId: string, count: number, idOffset: number): Sticker[] => {
  const stickers: Sticker[] = [];
  const baseDate = new Date('2026-06-01T10:00:00Z').getTime();
  let legendaryIdx = 0;
  let rareIdx = 0;

  for (let i = 1; i <= count; i++) {
    let rarity: Sticker['rarity'] = 'comum';
    if (i % 20 === 0) rarity = 'lendaria';
    else if (i % 5 === 0) rarity = 'rara';

    const globalIndex = idOffset + i;
    let playerName: string;
    if (rarity === 'lendaria') {
      playerName = LEGENDARY_NAMES[legendaryIdx % LEGENDARY_NAMES.length];
      legendaryIdx++;
    } else if (rarity === 'rara') {
      playerName = RARE_NAMES[rareIdx % RARE_NAMES.length];
      rareIdx++;
    } else {
      playerName = `Jogador ${globalIndex}`;
    }

    const obtainedAt = new Date(baseDate + globalIndex * 86400000).toISOString();

    stickers.push({
      id: `s${globalIndex}`,
      albumId,
      playerId: `p${globalIndex}`,
      teamId: `t${(globalIndex % 10) + 1}`,
      playerName,
      price: RARITY_PRICE[rarity],
      rarity,
      imageUrl: `https://fakeimg.pl/200x300/?text=${encodeURIComponent(playerName)}`,
      obtainedAt,
    });
  }
  return stickers;
};

export const mockStickers: Sticker[] = [
  ...generateStickers('a1', 100, 0),
  ...generateStickers('a2', 50, 100),
];

export const mockUserCollection: UserCollection = {
  userId: 'u1',
  albumId: 'a1',
  stickerIds: mockStickers.slice(0, 78).map(s => s.id),
  progress: 78,
};
