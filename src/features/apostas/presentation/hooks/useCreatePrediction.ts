import { useState } from 'react';
import { Prediction } from '../../domain/entities/Prediction';
import { makeCreatePrediction } from '../../main/factories/makeCreatePrediction';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';

export const useCreatePrediction = (onSuccess?: () => void) => {
  const user = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPrediction = async (matchId: string, homeScore: number, awayScore: number): Promise<Prediction | undefined> => {
    if (!user) return;
    try {
      setLoading(true);
      const useCase = makeCreatePrediction();
      const newPrediction = await useCase.execute({
        userId: user.id,
        matchId,
        predictedHomeScore: homeScore,
        predictedAwayScore: awayScore,
        reward: { type: 'coins', description: 'Recompensa base' }
      });
      if (onSuccess) onSuccess();
      return newPrediction;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { createPrediction, loading, error };
};
