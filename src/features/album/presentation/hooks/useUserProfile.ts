import { useState, useEffect, useCallback } from 'react';
import { UserProfileResult } from '../../domain/usecases/GetUserProfile';
import { makeGetUserProfile } from '../../main/factories/makeGetUserProfile';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';

export const useUserProfile = () => {
  const user = useCurrentUser();
  const [profile, setProfile] = useState<UserProfileResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const useCase = makeGetUserProfile();
      const data = await useCase.execute(user.id);
      setProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
};
