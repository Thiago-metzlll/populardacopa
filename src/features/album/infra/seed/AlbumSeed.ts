import { Album } from '../../domain/entities/Album';
import { Sticker } from '../../domain/entities/Sticker';
import { UserCollection } from '../../domain/entities/UserCollection';
import { AVAILABLE_PLAYERS } from '../../../../../database';

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

// Raridade por posição do jogador
const RARITY_BY_POSITION: Record<string, Sticker['rarity']> = {
  SPECIAL: 'lendaria',
  GOL: 'rara',
  ATA: 'rara',
  MEI: 'comum',
  DEF: 'comum',
  ESCUDO: 'comum',
};

const RARITY_PRICE: Record<Sticker['rarity'], number> = {
  comum: 20,
  rara: 60,
  lendaria: 150,
};

// Jogadores reais (campo, GOL, ATA, MEI, DEF)
const realPlayers = AVAILABLE_PLAYERS.filter(
  (p) => p.position !== 'SPECIAL' && p.position !== 'ESCUDO'
);

// Especiais e escudos para o álbum 2
const specialPlayers = AVAILABLE_PLAYERS.filter(
  (p) => p.position === 'SPECIAL' || p.position === 'ESCUDO'
);

const generateStickersFromPlayers = (
  albumId: string,
  players: typeof AVAILABLE_PLAYERS,
  count: number,
  idOffset: number
): Sticker[] => {
  const stickers: Sticker[] = [];
  const baseDate = new Date('2026-06-01T10:00:00Z').getTime();

  for (let i = 0; i < count; i++) {
    const player = players[i % players.length];
    const rarity: Sticker['rarity'] = RARITY_BY_POSITION[player.position] ?? 'comum';
    const globalIndex = idOffset + i + 1;

    stickers.push({
      id: `s${globalIndex}`,
      albumId,
      playerId: player.id,
      teamId: player.teamId,
      playerName: player.name,
      price: RARITY_PRICE[rarity],
      rarity,
      imageUrl:
        player.imageUrl ??
        `https://fakeimg.pl/200x300/?text=${encodeURIComponent(player.name)}&font=bebas`,
      obtainedAt: new Date(baseDate + globalIndex * 86400000).toISOString(),
    });
  }

  return stickers;
};

export const mockStickers: Sticker[] = [
  ...generateStickersFromPlayers('a1', realPlayers, 100, 0),
  ...generateStickersFromPlayers('a2', specialPlayers.concat(realPlayers), 50, 100),
];

export const mockUserCollection: UserCollection = {
  userId: 'u1',
  albumId: 'a1',
  stickerIds: mockStickers.slice(0, 78).map((s) => s.id),
  progress: 78,
};
