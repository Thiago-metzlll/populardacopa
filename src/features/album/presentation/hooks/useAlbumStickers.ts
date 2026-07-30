import { useState, useEffect, useCallback } from 'react';
import { Album } from '../../domain/entities/Album';
import { Sticker } from '../../domain/entities/Sticker';
import { makeGetAlbumStickers } from '../../main/factories/makeGetAlbumStickers';
import { makeGetAlbumById } from '../../main/factories/makeGetAlbumById';
import { makeGetUserCollection } from '../../main/factories/makeGetUserCollection';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';

export const useAlbumStickers = (albumId: string) => {
  const user = useCurrentUser();
  const [album, setAlbum] = useState<Album | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const getAlbumById = makeGetAlbumById();
      const getAlbumStickers = makeGetAlbumStickers();
      const getUserCollection = makeGetUserCollection();

      const [albumResult, stickersResult, collection] = await Promise.all([
        getAlbumById.execute(albumId),
        getAlbumStickers.execute(albumId),
        getUserCollection.execute(user.id),
      ]);

      setAlbum(albumResult);
      setStickers(stickersResult);
      setOwnedIds(new Set(collection.stickerIds));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, albumId]);

  useEffect(() => {
    // Fetch-on-mount/dependência: padrão recomendado pelos docs do React
    // (react.dev/learn/synchronizing-with-effects#fetching-data). A regra
    // react-hooks/set-state-in-effect (experimental, do React Compiler)
    // ainda não modela corretamente esse caso.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  return { album, stickers, ownedIds, loading, error, refetch: fetchData };
};
