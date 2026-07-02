import { useState, useEffect, useCallback } from 'react';
import { PredictionHistory } from '../../domain/entities/PredictionHistory';
import { makeGetPredictionHistory } from '../../main/factories/makeGetPredictionHistory';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';

export const usePredictionHistory = () => {
  const user = useCurrentUser();
  const [history, setHistory] = useState<PredictionHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const useCase = makeGetPredictionHistory();
      const data = await useCase.execute(user.id);
      setHistory(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, error, refetch: fetchHistory };
};
