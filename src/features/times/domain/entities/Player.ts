export interface PlayerStats {
  goals: number;
  assists: number;
  matchesPlayed: number;
  worldCupsPlayed: number;
}

export interface PlayerEditionRecord {
  edition: string;  // e.g. "Copa 2022"
  team: string;     // e.g. "Argentina"
  result: string;   // e.g. "Campeão", "Quartas-de-final"
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  teamId: string;
  photoUrl?: string;
  awards?: string[];           // e.g. ['ARTILHEIRO', 'MVP']
  worldCupHistory?: PlayerEditionRecord[];
  stats: PlayerStats;
}
