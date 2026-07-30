import { useState, useEffect, useCallback } from 'react';
import { Sticker } from '../../domain/entities/Sticker';
import { DailyClaimStatus } from '../../domain/constants/rewards';
import { makeGetFreePackStatus } from '../../main/factories/makeGetFreePackStatus';
import { makeClaimFreePackage } from '../../main/factories/makeClaimFreePackage';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';

export const useFreePackage = () => {
  const user = useCurrentUser();
  const [status, setStatus] = useState<DailyClaimStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const result = await makeGetFreePackStatus().execute(user.id);
      setStatus(result);
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
    loadStatus();
  }, [loadStatus]);

  const claim = useCallback(async (): Promise<Sticker[] | undefined> => {
    if (!user) return;
    try {
      setClaiming(true);
      setError(null);
      const stickers = await makeClaimFreePackage().execute(user.id);
      await loadStatus();
      return stickers;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setClaiming(false);
    }
  }, [user, loadStatus]);

  return { status, loading, claiming, error, claim };
};
