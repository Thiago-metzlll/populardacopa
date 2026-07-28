import {
  computeDailyClaimStatus,
  computeDailyCoinsStatus,
  computeFreePackStatus,
  DAILY_COINS_REWARD,
  DAILY_REWARD_COOLDOWN_MS,
  FREE_PACK_COOLDOWN_MS,
} from './rewards';

describe('computeDailyClaimStatus', () => {
  it('libera quando nunca foi resgatado', () => {
    const status = computeDailyClaimStatus(null, DAILY_REWARD_COOLDOWN_MS);

    expect(status).toEqual({ available: true, nextAvailableAt: null });
  });

  it('bloqueia antes do fim do cooldown', () => {
    const now = new Date('2026-07-28T12:00:00.000Z');
    const lastClaimedAt = new Date('2026-07-28T00:00:00.000Z').toISOString();

    const status = computeDailyClaimStatus(lastClaimedAt, DAILY_REWARD_COOLDOWN_MS, now);

    expect(status.available).toBe(false);
    expect(status.nextAvailableAt).toBe(new Date('2026-07-29T00:00:00.000Z').toISOString());
  });

  it('libera exatamente no limite do cooldown', () => {
    const lastClaimedAt = new Date('2026-07-28T00:00:00.000Z').toISOString();
    const now = new Date('2026-07-29T00:00:00.000Z');

    const status = computeDailyClaimStatus(lastClaimedAt, DAILY_REWARD_COOLDOWN_MS, now);

    expect(status).toEqual({ available: true, nextAvailableAt: null });
  });

  it('libera depois do fim do cooldown', () => {
    const lastClaimedAt = new Date('2026-07-27T00:00:00.000Z').toISOString();
    const now = new Date('2026-07-29T00:00:00.000Z');

    const status = computeDailyClaimStatus(lastClaimedAt, DAILY_REWARD_COOLDOWN_MS, now);

    expect(status).toEqual({ available: true, nextAvailableAt: null });
  });
});

describe('computeDailyCoinsStatus', () => {
  it('usa o cooldown de moedas diárias e retorna o valor fixo de recompensa', () => {
    const status = computeDailyCoinsStatus(null);

    expect(status).toEqual({ available: true, nextAvailableAt: null, amount: DAILY_COINS_REWARD });
  });

  it('bloqueia dentro do cooldown de moedas diárias', () => {
    const now = new Date('2026-07-28T12:00:00.000Z');
    const lastClaimedAt = new Date('2026-07-28T06:00:00.000Z').toISOString();

    const status = computeDailyCoinsStatus(lastClaimedAt, now);

    expect(status.available).toBe(false);
    expect(status.amount).toBe(DAILY_COINS_REWARD);
  });
});

describe('computeFreePackStatus', () => {
  it('usa o mesmo cooldown de 24h do pacote grátis', () => {
    const now = new Date('2026-07-28T12:00:00.000Z');
    const lastClaimedAt = new Date('2026-07-28T00:00:00.000Z').toISOString();

    const status = computeFreePackStatus(lastClaimedAt, now);

    expect(FREE_PACK_COOLDOWN_MS).toBe(DAILY_REWARD_COOLDOWN_MS);
    expect(status.available).toBe(false);
  });

  it('libera o pacote grátis depois do cooldown', () => {
    const now = new Date('2026-07-30T00:00:00.000Z');
    const lastClaimedAt = new Date('2026-07-28T00:00:00.000Z').toISOString();

    const status = computeFreePackStatus(lastClaimedAt, now);

    expect(status.available).toBe(true);
  });
});
