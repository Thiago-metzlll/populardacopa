export interface PlayerStats {
  goals: number;
  assists: number;
  matchesPlayed: number;
  worldCupsPlayed: number;
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  teamId: string;
  stats: PlayerStats;
}
