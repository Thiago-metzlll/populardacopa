import { generatePlayerStats } from './playerStats';

const sequence = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe('generatePlayerStats', () => {
  it('atacante (ATA): calcula goals/assists dentro da faixa de atacante', () => {
    const low = generatePlayerStats('ATA', sequence([0, 0, 0, 0]));
    expect(low).toEqual({ goals: 1, assists: 0, matchesPlayed: 3, worldCupsPlayed: 1 });

    const high = generatePlayerStats('ATA', sequence([0.999, 0.999, 0.999, 0.999]));
    expect(high).toEqual({ goals: 3, assists: 1, matchesPlayed: 6, worldCupsPlayed: 2 });
  });

  it('meia (MEI): calcula goals/assists dentro da faixa de meio-campo', () => {
    const low = generatePlayerStats('MEI', sequence([0, 0, 0, 0]));
    expect(low).toEqual({ goals: 0, assists: 1, matchesPlayed: 3, worldCupsPlayed: 1 });
  });

  it('defensor (DEF): só marca gol quando random > 0.8', () => {
    const withGoal = generatePlayerStats('DEF', sequence([0, 0, 0.9, 0]));
    expect(withGoal.goals).toBe(1);

    const withoutGoal = generatePlayerStats('DEF', sequence([0, 0, 0.1, 0]));
    expect(withoutGoal.goals).toBe(0);
  });

  it('posição desconhecida: goals e assists ficam zerados, mas matchesPlayed/worldCupsPlayed continuam sendo gerados', () => {
    const stats = generatePlayerStats('GOL', sequence([0, 0]));
    expect(stats).toEqual({ goals: 0, assists: 0, matchesPlayed: 3, worldCupsPlayed: 1 });
  });

  it('matchesPlayed fica entre 3 e 6, worldCupsPlayed entre 1 e 2', () => {
    const stats = generatePlayerStats('ATA', sequence([0.5, 0.5, 0.5, 0.5]));
    expect(stats.matchesPlayed).toBeGreaterThanOrEqual(3);
    expect(stats.matchesPlayed).toBeLessThanOrEqual(6);
    expect(stats.worldCupsPlayed).toBeGreaterThanOrEqual(1);
    expect(stats.worldCupsPlayed).toBeLessThanOrEqual(2);
  });
});
