import { useState, useEffect, useCallback } from 'react';
import { Team } from '../../domain/entities/Team';
import { makeGetAllTeams } from '../../main/factories/makeGetAllTeams';
import { makeGetFavoriteTeams } from '../../main/factories/makeGetFavoriteTeams';
import { makeSearchTeams } from '../../main/factories/makeSearchTeams';
import { makeToggleFavoriteTeam } from '../../main/factories/makeToggleFavoriteTeam';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';

export const useTimesScreen = () => {
  const user = useCurrentUser();

  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [favoriteTeams, setFavoriteTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllTeams = useCallback(async () => {
    try {
      setLoading(true);
      const useCase = makeGetAllTeams();
      const data = await useCase.execute();
      setAllTeams(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFavoriteTeams = useCallback(async () => {
    if (!user) {
      setFavoriteTeams([]);
      return;
    }
    try {
      const useCase = makeGetFavoriteTeams();
      const data = await useCase.execute(user.id);
      setFavoriteTeams(data);
    } catch (err: any) {
      setError(err.message);
    }
  }, [user]);

  const search = async (query: string) => {
    if (!query.trim()) {
      // Restaurar lista completa quando pesquisa vazia
      fetchAllTeams();
      if (user) fetchFavoriteTeams();
      return;
    }
    try {
      setLoading(true);
      const useCase = makeSearchTeams();
      const results = await useCase.execute(user?.id, query);
      setAllTeams(results);
      // Filtrar favoritos dentro dos resultados de busca
      if (user) {
        setFavoriteTeams(results.filter((t) => t.isFavorite));
      }
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
      // Atualizar as duas listas após alteração
      await fetchAllTeams();
      await fetchFavoriteTeams();
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchAllTeams();
  }, [fetchAllTeams]);

  useEffect(() => {
    fetchFavoriteTeams();
  }, [fetchFavoriteTeams]);

  return { allTeams, favoriteTeams, loading, error, search, toggleFavorite };
};
