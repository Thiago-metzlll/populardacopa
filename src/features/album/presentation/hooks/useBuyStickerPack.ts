import { useState } from 'react';
import { makeBuyStickerPack } from '../../main/factories/makeBuyStickerPack';
import { useCurrentUser, useRefreshCoins } from '../../../../shared/presentation/contexts/UserContext';
import { BuyStickerPackResult } from '../../domain/repositories/AlbumRepository';
import { pendingPackStore } from '../../infra/stores/pendingPackStore';

export const useBuyStickerPack = (onSuccess?: (result: BuyStickerPackResult) => void) => {
  const user = useCurrentUser();
  const refreshCoins = useRefreshCoins();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buyPack = async (albumId: string, cost: number): Promise<BuyStickerPackResult | undefined> => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const useCase = makeBuyStickerPack();
      const result = await useCase.execute(user.id, albumId, cost);
      // Guarda os stickers no store para que a tela de abertura
      // possa exibi-los sem re-sortear (evita double-draw)
      pendingPackStore.set(result.packId, result.stickers);
      await refreshCoins();
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { buyPack, loading, error };
};
