import { useState, useEffect, useCallback } from 'react';
import { DailyCoinsStatus } from '../../domain/constants/rewards';
import { makeGetDailyCoinsStatus } from '../../main/factories/makeGetDailyCoinsStatus';
import { makeClaimDailyCoins } from '../../main/factories/makeClaimDailyCoins';
import { useCurrentUser, useRefreshCoins } from '../../../../shared/presentation/contexts/UserContext';

export const useDailyCoinsReward = () => {
  const user = useCurrentUser();
  const refreshCoins = useRefreshCoins();
  const [status, setStatus] = useState<DailyCoinsStatus | null>(null);
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
      const result = await makeGetDailyCoinsStatus().execute(user.id);
      setStatus(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const claim = useCallback(async () => {
    if (!user) return;
    try {
      setClaiming(true);
      setError(null);
      const result = await makeClaimDailyCoins().execute(user.id);
      await refreshCoins();
      await loadStatus();
      return result;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setClaiming(false);
    }
  }, [user, refreshCoins, loadStatus]);

  return { status, loading, claiming, error, claim };
};
