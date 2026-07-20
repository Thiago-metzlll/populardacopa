import { useEffect, useRef, useState } from 'react';
import { Prediction } from '../../domain/entities/Prediction';
import { makeSettlePendingPredictions } from '../../main/factories/makeSettlePendingPredictions';
import { useCurrentUser, useRefreshCoins } from '../../../../shared/presentation/contexts/UserContext';

/**
 * Ao montar (com o usuário resolvido), verifica se algum palpite pendente já pode
 * ser resolvido (a partida correspondente terminou) e credita a recompensa —
 * "settlement" client-side, disparado ao abrir a tela de apostas.
 */
export const useSettlePendingPredictions = (onSettled?: (settled: Prediction[]) => void) => {
  const user = useCurrentUser();
  const refreshCoins = useRefreshCoins();
  const [loading, setLoading] = useState(false);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const result = await makeSettlePendingPredictions().execute(user.id);
        if (!cancelled && result.length > 0) {
          await refreshCoins();
          onSettledRef.current?.(result);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { loading };
};
