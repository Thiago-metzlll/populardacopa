export interface Team {
  id: string;
  name: string;
  countryId: string;
  groupId: string;
  ranking: number;
  winRate: number;
  isFavorite: boolean;
  titles: string[];
  worldCupWins: number;
  description: string;
  isUnbeaten: boolean;
}
