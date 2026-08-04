export interface GroupStanding {
  teamId: string;
  teamName: string;
  points: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface Group {
  id: string;
  name: string;
  teamIds: string[];
  standings: GroupStanding[];
}
