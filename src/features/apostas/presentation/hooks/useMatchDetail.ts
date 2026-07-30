import { useState, useEffect, useCallback } from 'react';
import { Match } from '../../domain/entities/Match';
import { makeGetUpcomingMatches } from '../../main/factories/makeGetUpcomingMatches';

export const useMatchDetail = (matchId: string) => {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatch = useCallback(async () => {
    if (!matchId) return;
    try {
      setLoading(true);
      const useCase = makeGetUpcomingMatches();
      const matches = await useCase.execute();
      const foundMatch = matches.find((m) => m.id === matchId);
      if (foundMatch) {
        setMatch(foundMatch);
      } else {
        setError('Partida não encontrada');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    // Fetch-on-mount: padrão recomendado pelo React; falso positivo conhecido
    // do react-hooks/set-state-in-effect (regra experimental do React Compiler).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMatch();
  }, [fetchMatch]);

  return { match, loading, error, refetch: fetchMatch };
};
