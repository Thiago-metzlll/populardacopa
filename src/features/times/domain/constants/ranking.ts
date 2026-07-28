/**
 * Pura: converte o ranking FIFA de um time num winRate pseudo-calculado
 * usado só para exibição (sem estatística real por trás).
 */
export function computeWinRate(ranking: number): number {
  return ranking > 0 ? Math.max(0.3, 1 - ranking / 100) : 0.5;
}
