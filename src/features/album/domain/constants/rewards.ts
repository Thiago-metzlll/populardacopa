export const DAILY_COINS_REWARD = 50;
export const DAILY_REWARD_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const FREE_PACK_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export interface DailyClaimStatus {
  available: boolean;
  nextAvailableAt: string | null;
}

export interface DailyCoinsStatus extends DailyClaimStatus {
  amount: number;
}

/**
 * Pura: calcula se uma recompensa diária está disponível a partir do último resgate
 * e do cooldown aplicável. Mantém a regra de cooldown em um único lugar,
 * reutilizada tanto por moedas diárias quanto pelo pacote grátis diário.
 */
export function computeDailyClaimStatus(
  lastClaimedAtIso: string | null,
  cooldownMs: number,
  now: Date = new Date(),
): DailyClaimStatus {
  if (!lastClaimedAtIso) {
    return { available: true, nextAvailableAt: null };
  }

  const nextAvailableAt = new Date(new Date(lastClaimedAtIso).getTime() + cooldownMs);
  const available = now.getTime() >= nextAvailableAt.getTime();

  return {
    available,
    nextAvailableAt: available ? null : nextAvailableAt.toISOString(),
  };
}

export function computeDailyCoinsStatus(
  lastClaimedAtIso: string | null,
  now: Date = new Date(),
): DailyCoinsStatus {
  return {
    ...computeDailyClaimStatus(lastClaimedAtIso, DAILY_REWARD_COOLDOWN_MS, now),
    amount: DAILY_COINS_REWARD,
  };
}

export function computeFreePackStatus(
  lastClaimedAtIso: string | null,
  now: Date = new Date(),
): DailyClaimStatus {
  return computeDailyClaimStatus(lastClaimedAtIso, FREE_PACK_COOLDOWN_MS, now);
}
