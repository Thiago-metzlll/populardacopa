import { Sticker } from '../entities/Sticker';

/**
 * Quantas figurinhas saem em um pacote — regra de negócio, não detalhe de
 * persistência. Vale tanto para o pacote comprado quanto para o grátis diário.
 */
export const PACK_SIZE = 3;

/**
 * O progresso do álbum é sempre calculado contra este álbum de referência,
 * em todas as operações que gravam `progress`. Sem isso o valor persistido
 * flutuaria conforme o álbum da última ação.
 */
export const REFERENCE_ALBUM_ID = 'a1';

/** Pura: percentual da coleção completada. */
export function computeCollectionProgress(ownedCount: number, totalStickers: number): number {
  return (ownedCount / totalStickers) * 100;
}

/**
 * Sorteia até `count` figurinhas do pool que o usuário ainda não possui,
 * sem repetição. `random` é injetável (default `Math.random`) para teste
 * determinístico. Usado no pacote grátis diário e no fluxo legado de abertura.
 */
export function drawUnownedStickers(
  pool: Sticker[],
  ownedIds: string[],
  count: number,
  random: () => number = Math.random,
): Sticker[] {
  const notOwned = pool.filter((s) => !ownedIds.includes(s.id));
  const numToDraw = Math.min(count, notOwned.length);
  const shuffled = [...notOwned].sort(() => 0.5 - random());
  return shuffled.slice(0, numToDraw);
}

/**
 * Sorteia `count` figurinhas do pool inteiro, podendo repetir — usado na
 * compra de pacote, onde a mesma figurinha pode sair mais de uma vez.
 */
export function drawStickersWithRepetition(
  pool: Sticker[],
  count: number,
  random: () => number = Math.random,
): Sticker[] {
  const drawn: Sticker[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(random() * pool.length);
    drawn.push(pool[idx]);
  }
  return drawn;
}
