import { useState, useEffect, useCallback } from 'react';
import { Team } from '../../domain/entities/Team';
import { Player } from '../../domain/entities/Player';
import { makeGetTeamById } from '../../main/factories/makeGetTeamById';

export const useTeamDetail = (teamId: string) => {
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    if (!teamId) return;
    try {
      setLoading(true);
      const useCase = makeGetTeamById();
      const data = await useCase.execute(teamId);
      setTeam(data.team);
      setPlayers(data.players);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    // Fetch-on-mount: padrão recomendado pelo React; falso positivo conhecido
    // do react-hooks/set-state-in-effect (regra experimental do React Compiler).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTeam();
  }, [fetchTeam]);

  return { team, players, loading, error, refetch: fetchTeam };
};
