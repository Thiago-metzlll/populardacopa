// ─── Tipos locais do seed (independentes do Domain) ────────────────────────────
// Estes tipos representam a estrutura dos dados estáticos usados pelas migrations
// do SQLite. São diferentes dos tipos de Domain que vivem em src/features/*/domain.

export type PlayerPosition = 'GOL' | 'DEF' | 'MEI' | 'ATA' | 'ESCUDO' | 'SPECIAL';
export type StickerType = 'BASE' | 'GOLD' | 'LEGEND';

export interface Team {
  id: string;
  name: string;
  group: string;
  flagUrl: string;
  subtitle?: string;
  ranking?: number;
  worldCupWins?: number;
  titles?: string[];
  description?: string;
  isUnbeaten?: boolean;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  position: PlayerPosition;
  type: StickerType;
  number: string;
  imageUrl?: string;
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  group: string;
  round: string;
  date: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
}
