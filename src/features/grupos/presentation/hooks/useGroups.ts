import { useState, useEffect } from 'react';
import { Group } from '../../domain/entities/Group';
import { makeGetAllGroups } from '../../main/factories/makeGetAllGroups';

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const useCase = makeGetAllGroups();
        const data = await useCase.execute();
        setGroups(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  return { groups, loading, error };
};
