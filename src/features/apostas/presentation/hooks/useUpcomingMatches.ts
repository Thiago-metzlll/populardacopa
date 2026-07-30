import { useState, useEffect, useCallback } from 'react';
import { Match } from '../../domain/entities/Match';
import { makeGetUpcomingMatches } from '../../main/factories/makeGetUpcomingMatches';

export const useUpcomingMatches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const useCase = makeGetUpcomingMatches();
      const data = await useCase.execute();
      setMatches(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount: padrão recomendado pelo React; falso positivo conhecido
    // do react-hooks/set-state-in-effect (regra experimental do React Compiler).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMatches();
  }, [fetchMatches]);

  return { matches, loading, error };
};
