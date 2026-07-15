import { useState, useEffect, useCallback } from 'react';
import { Team } from '../../domain/entities/Team';
import { makeGetFavoriteTeams } from '../../main/factories/makeGetFavoriteTeams';
import { makeSearchTeams } from '../../main/factories/makeSearchTeams';
import { makeToggleFavoriteTeam } from '../../main/factories/makeToggleFavoriteTeam';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';

export const useFavoriteTeams = () => {
  const user = useCurrentUser();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    if (!user) {
      setTeams([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const useCase = makeGetFavoriteTeams();
      const data = await useCase.execute(user.id);
      setTeams(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const search = async (query: string) => {
    if (!user) return;
    try {
      setLoading(true);
      const useCase = makeSearchTeams();
      const data = await useCase.execute(user.id, query);
      setTeams(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (teamId: string) => {
    if (!user) return;
    try {
      const useCase = makeToggleFavoriteTeam();
      await useCase.execute(user.id, teamId);
      await fetchTeams(); // atualiza a lista após alterar o favorito
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return { teams, loading, error, search, toggleFavorite };
};
