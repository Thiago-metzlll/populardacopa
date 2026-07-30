import { useState, useEffect, useCallback, useMemo } from 'react';
import { Sticker } from '../../domain/entities/Sticker';
import { Rarity } from '../../../../shared/presentation/theme';
import { makeGetAllStickers } from '../../main/factories/makeGetAllStickers';
import { makeGetUserCollection } from '../../main/factories/makeGetUserCollection';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';

export interface RaritySection {
  rarity: Rarity;
  stickers: Sticker[];
  ownedCount: number;
  totalCount: number;
}

const RARITY_ORDER: Rarity[] = ['lendaria', 'rara', 'comum'];

export const useAllStickers = () => {
  const user = useCurrentUser();
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const getAllStickers = makeGetAllStickers();
      const getUserCollection = makeGetUserCollection();

      const [allStickers, collection] = await Promise.all([
        getAllStickers.execute(),
        getUserCollection.execute(user.id),
      ]);

      setStickers(allStickers);
      setOwnedIds(new Set(collection.stickerIds));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Fetch-on-mount: padrão recomendado pelo React; falso positivo conhecido
    // do react-hooks/set-state-in-effect (regra experimental do React Compiler).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const sections = useMemo<RaritySection[]>(() => {
    return RARITY_ORDER.map((rarity) => {
      const rarityStickers = stickers.filter((s) => s.rarity === rarity);
      return {
        rarity,
        stickers: rarityStickers,
        ownedCount: rarityStickers.filter((s) => ownedIds.has(s.id)).length,
        totalCount: rarityStickers.length,
      };
    });
  }, [stickers, ownedIds]);

  return { sections, ownedIds, loading, error, refetch: fetchData };
};
