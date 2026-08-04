import { useState, useEffect, useCallback } from 'react';
import { Group } from '../../domain/entities/Group';
import { makeGetAllGroups } from '../../main/factories/makeGetAllGroups';

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      setError(null);
      const useCase = makeGetAllGroups();
      const data = await useCase.execute();
      setGroups(data);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount: padrão recomendado pelo React; falso positivo conhecido
    // do react-hooks/set-state-in-effect (regra experimental do React Compiler).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGroups().finally(() => setLoading(false));
  }, [fetchGroups]);

  // Pull-to-refresh usa `refreshing` em vez de `loading` para não desmontar a
  // lista e trocá-la pelo spinner de tela cheia a cada puxada.
  const refetch = useCallback(async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  }, [fetchGroups]);

  return { groups, loading, refreshing, error, refetch };
};
