import { useState, useEffect, useCallback } from 'react';
import { Album } from '../../domain/entities/Album';
import { makeGetMarketAlbums } from '../../main/factories/makeGetMarketAlbums';
import { makeGetUserCoins } from '../../main/factories/makeGetUserCoins';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';

export const useMarketAlbums = () => {
  const user = useCurrentUser();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [coins, setCoins] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const marketAlbumsUseCase = makeGetMarketAlbums();
      const userCoinsUseCase = makeGetUserCoins();

      const [marketAlbums, userCoins] = await Promise.all([
        marketAlbumsUseCase.execute(user.id),
        userCoinsUseCase.execute(user.id),
      ]);

      setAlbums(marketAlbums);
      setCoins(userCoins);
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

  return { albums, coins, loading, error, refetch: fetchData };
};
