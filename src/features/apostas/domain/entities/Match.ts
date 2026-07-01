export interface MatchOdds {
  homeWin: number;
  draw: number;
  awayWin: number;
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  date: string;
  phase: string;
  status: 'scheduled' | 'live' | 'finished';
  odds?: MatchOdds;
}
