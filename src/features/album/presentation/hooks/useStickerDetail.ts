import { useState, useEffect, useCallback } from 'react';
import { Sticker } from '../../domain/entities/Sticker';
import { makeGetStickersByIds } from '../../main/factories/makeGetStickersByIds';
import { makeGetUserCollection } from '../../main/factories/makeGetUserCollection';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';

export const useStickerDetail = (stickerId: string) => {
  const user = useCurrentUser();
  const [sticker, setSticker] = useState<Sticker | null>(null);
  const [owned, setOwned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const getStickersByIds = makeGetStickersByIds();
      const getUserCollection = makeGetUserCollection();

      const [stickers, collection] = await Promise.all([
        getStickersByIds.execute([stickerId]),
        getUserCollection.execute(user.id),
      ]);

      setSticker(stickers[0] ?? null);
      setOwned(collection.stickerIds.includes(stickerId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, stickerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { sticker, owned, loading, error, refetch: fetchData };
};
