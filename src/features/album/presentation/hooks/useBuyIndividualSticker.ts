import { useState } from 'react';
import { makeBuyIndividualSticker } from '../../main/factories/makeBuyIndividualSticker';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';
import { Sticker } from '../../domain/entities/Sticker';

export const useBuyIndividualSticker = (onSuccess?: (sticker: Sticker) => void) => {
  const user = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buySticker = async (stickerId: string, cost: number): Promise<Sticker | undefined> => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const useCase = makeBuyIndividualSticker();
      const result = await useCase.execute(user.id, stickerId, cost);
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { buySticker, loading, error };
};
