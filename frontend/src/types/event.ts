export interface Event {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: 'PENDING' | 'LIVE' | 'FINISHED' | 'CANCELLED';
  markets?: Market[];
}

export interface Market {
  id: string;
  type: string;
  name: string;
  odds: Odds[];
}

export interface Odds {
  id: string;
  value: number;
  isActive: boolean;
  current: boolean;
}

export interface EventsResponse {
  live: Event[];
  preMatch: Event[];
}
