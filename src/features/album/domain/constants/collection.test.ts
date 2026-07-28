import { computeCollectionProgress, drawUnownedStickers, drawStickersWithRepetition } from './collection';
import { Sticker } from '../entities/Sticker';

const makeSticker = (id: string): Sticker => ({
  id,
  albumId: 'album-1',
  playerName: `Jogador ${id}`,
  price: 10,
  rarity: 'comum',
  imageUrl: 'https://example.com/img.png',
  obtainedAt: '',
});

const sequence = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe('computeCollectionProgress', () => {
  it('calcula o percentual de figurinhas possuídas em relação ao total', () => {
    expect(computeCollectionProgress(0, 10)).toBe(0);
    expect(computeCollectionProgress(5, 10)).toBe(50);
    expect(computeCollectionProgress(10, 10)).toBe(100);
  });
});

describe('drawUnownedStickers', () => {
  const pool = [makeSticker('s1'), makeSticker('s2'), makeSticker('s3'), makeSticker('s4')];

  it('nunca sorteia uma figurinha já possuída', () => {
    const result = drawUnownedStickers(pool, ['s1', 's2'], 3);

    expect(result.every((s) => !['s1', 's2'].includes(s.id))).toBe(true);
  });

  it('sorteia no máximo `count` figurinhas', () => {
    const result = drawUnownedStickers(pool, [], 2);

    expect(result).toHaveLength(2);
  });

  it('sorteia menos que `count` quando não há figurinhas suficientes disponíveis', () => {
    const result = drawUnownedStickers(pool, ['s1', 's2', 's3'], 3);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('s4');
  });

  it('não repete figurinhas no resultado', () => {
    const result = drawUnownedStickers(pool, [], 4);
    const ids = result.map((s) => s.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('drawStickersWithRepetition', () => {
  const pool = [makeSticker('s0'), makeSticker('s1'), makeSticker('s2')];

  it('escolhe o índice via floor(random() * pool.length), podendo repetir', () => {
    const result = drawStickersWithRepetition(pool, 3, sequence([0, 0.5, 0.99]));

    expect(result.map((s) => s.id)).toEqual(['s0', 's1', 's2']);
  });

  it('repete a mesma figurinha quando o random injetado retorna sempre o mesmo valor', () => {
    const result = drawStickersWithRepetition(pool, 3, sequence([0]));

    expect(result.map((s) => s.id)).toEqual(['s0', 's0', 's0']);
  });
});
