import axios from 'axios';

export interface EventFilters {
  sport?: string;
  league?: string;
  time?: 'today' | 'tomorrow' | 'live' | 'all';
  sortBy?: 'startTime' | 'popularity' | 'prizePool';
}

export const getEvents = async (filters: EventFilters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.sport && filters.sport !== 'all') params.append('sport', filters.sport);
  if (filters.league && filters.league !== 'all') params.append('league', filters.league);
  if (filters.time && filters.time !== 'all') params.append('time', filters.time);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);

  const response = await axios.get(`/api/events?${params.toString()}`);
  return response.data;
};

export const getSports = async () => {
  const response = await axios.get('/api/events/sports');
  return response.data;
};

export const getLeagues = async (sport?: string) => {
  const params = sport ? `?sport=${sport}` : '';
  const response = await axios.get(`/api/events/leagues${params}`);
  return response.data;
};
