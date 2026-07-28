import { PlayerStats } from '../entities/Player';

/**
 * Pura: gera estatísticas fictícias de um jogador para a Copa, com faixas
 * diferentes por posição, só para enriquecer a interface (não há dado real).
 * `random` é injetável (default `Math.random`) para permitir teste determinístico.
 */
export function generatePlayerStats(position: string, random: () => number = Math.random): PlayerStats {
  let goals = 0;
  let assists = 0;
  const matchesPlayed = Math.floor(random() * 4) + 3; // 3 a 7 jogos na copa
  const worldCupsPlayed = Math.floor(random() * 2) + 1; // 1 ou 2 copas

  if (position === 'ATA') {
    goals = Math.floor(random() * 3) + 1;
    assists = Math.floor(random() * 2);
  } else if (position === 'MEI') {
    goals = Math.floor(random() * 2);
    assists = Math.floor(random() * 3) + 1;
  } else if (position === 'DEF') {
    goals = random() > 0.8 ? 1 : 0;
    assists = Math.floor(random() * 2);
  }

  return { goals, assists, matchesPlayed, worldCupsPlayed };
}
