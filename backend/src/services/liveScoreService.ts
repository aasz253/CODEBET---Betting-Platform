import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const FOOTBALL_API_KEY = '4e031aec0d80491fb7a3e28d9368990c';
const FOOTBALL_API_BASE = 'https://api.football-data.org/v4';

interface FootballMatch {
  id: number;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score: {
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
  status: string;
  minute: number | null;
  lastUpdated: string;
}

interface MatchEvent {
  type: 'GOAL' | 'CARD' | 'SUBSTITUTION';
  minute: number;
  team: 'HOME' | 'AWAY';
  player: string;
  detail?: string;
}

export const fetchLiveMatches = async () => {
  try {
    const response = await axios.get(`${FOOTBALL_API_BASE}/matches`, {
      headers: { 'X-Auth-Token': FOOTBALL_API_KEY },
      params: {
        status: 'LIVE',
      },
    });

    return response.data.matches || [];
  } catch (error) {
    console.error('Failed to fetch live matches:', error);
    return [];
  }
};

export const fetchMatchDetails = async (matchId: number) => {
  try {
    const response = await axios.get(`${FOOTBALL_API_BASE}/matches/${matchId}`, {
      headers: { 'X-Auth-Token': FOOTBALL_API_KEY },
    });

    return response.data;
  } catch (error) {
    console.error('Failed to fetch match details:', error);
    return null;
  }
};

export const updateLiveMatch = async (eventId: string, matchData: any) => {
  try {
    const existingMatch = await prisma.liveMatch.findUnique({
      where: { eventId },
    });

    const matchEvents: MatchEvent[] = matchData.goals || matchData.cards || [];

    const data = {
      homeScore: matchData.score?.fullTime?.home ?? 0,
      awayScore: matchData.score?.fullTime?.away ?? 0,
      matchTime: matchData.minute ?? 0,
      status: mapStatus(matchData.status),
      events: JSON.stringify(matchEvents),
      homePossession: matchData.possession?.home ?? 50,
      awayPossession: matchData.possession?.away ?? 50,
      homeShots: matchData.shots?.home ?? 0,
      awayShots: matchData.shots?.away ?? 0,
      homeCorners: matchData.corners?.home ?? 0,
      awayCorners: matchData.corners?.away ?? 0,
      lastUpdated: new Date(),
    };

    if (existingMatch) {
      return await prisma.liveMatch.update({
        where: { eventId },
        data,
      });
    } else {
      return await prisma.liveMatch.create({
        data: {
          eventId,
          ...data,
        },
      });
    }
  } catch (error) {
    console.error('Failed to update live match:', error);
    return null;
  }
};

const mapStatus = (apiStatus: string): string => {
  switch (apiStatus) {
    case 'LIVE': return 'LIVE';
    case 'IN_PLAY': return 'LIVE';
    case 'PAUSED': return 'HALFTIME';
    case 'FINISHED': return 'FINISHED';
    case 'SCHEDULED': return 'NOT_STARTED';
    default: return 'NOT_STARTED';
  }
};

export const pollLiveMatches = async () => {
  try {
    const liveMatches = await fetchLiveMatches();
    
    for (const match of liveMatches) {
      const event = await prisma.event.findFirst({
        where: {
          homeTeam: match.homeTeam.name,
          awayTeam: match.awayTeam.name,
          startTime: {
            gte: new Date(Date.now() - 3 * 60 * 60 * 1000),
          },
        },
      });

      if (event) {
        await updateLiveMatch(event.id, match);
        
        if (match.status === 'LIVE' && event.status !== 'LIVE') {
          await prisma.event.update({
            where: { id: event.id },
            data: { status: 'LIVE' },
          });
        }
      }
    }

    console.log(`Updated ${liveMatches.length} live matches`);
  } catch (error) {
    console.error('Polling error:', error);
  }
};

export const startLiveMatchPolling = () => {
  console.log('Starting live match polling...');
  pollLiveMatches();
  
  setInterval(async () => {
    await pollLiveMatches();
  }, 30000);
};
