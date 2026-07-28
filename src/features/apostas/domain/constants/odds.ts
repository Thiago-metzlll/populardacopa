import { MatchOdds } from '../entities/Match';

/**
 * Pura: gera odds fictícias e determinísticas a partir de um hash do id da
 * partida — o mesmo id sempre produz as mesmas odds, sem precisar persistir nada.
 */
export function computeMatchOdds(matchId: string): MatchOdds {
  const hash = matchId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return {
    homeWin: Number((1.5 + (hash % 10) * 0.2).toFixed(2)),
    draw: Number((2.8 + (hash % 5) * 0.15).toFixed(2)),
    awayWin: Number((2.0 + (hash % 8) * 0.25).toFixed(2)),
  };
}
