import { useState } from 'react';
import { Sticker } from '../../domain/entities/Sticker';
import { makeOpenPackage } from '../../main/factories/makeOpenPackage';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';

export const useOpenPackage = (onSuccess?: () => void) => {
  const user = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPackage = async (packageId: string): Promise<Sticker[] | undefined> => {
    if (!user) return;
    try {
      setLoading(true);
      const useCase = makeOpenPackage();
      const newStickers = await useCase.execute(packageId, user.id);
      if (onSuccess) onSuccess();
      return newStickers;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { openPackage, loading, error };
};
