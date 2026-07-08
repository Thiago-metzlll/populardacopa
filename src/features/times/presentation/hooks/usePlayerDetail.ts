import { useState, useEffect, useCallback } from 'react';
import { Player } from '../../domain/entities/Player';
import { makeGetPlayerById } from '../../main/factories/makeGetPlayerById';

export const usePlayerDetail = (playerId: string) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayer = useCallback(async () => {
    if (!playerId) return;
    try {
      setLoading(true);
      const useCase = makeGetPlayerById();
      const data = await useCase.execute(playerId);
      setPlayer(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    fetchPlayer();
  }, [fetchPlayer]);

  return { player, loading, error, refetch: fetchPlayer };
};
