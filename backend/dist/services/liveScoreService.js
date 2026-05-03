"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startLiveMatchPolling = exports.pollLiveMatches = exports.updateLiveMatch = exports.fetchMatchDetails = exports.fetchLiveMatches = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const FOOTBALL_API_KEY = '4e031aec0d80491fb7a3e28d9368990c';
const FOOTBALL_API_BASE = 'https://api.football-data.org/v4';
const fetchLiveMatches = async () => {
    try {
        const response = await axios_1.default.get(`${FOOTBALL_API_BASE}/matches`, {
            headers: { 'X-Auth-Token': FOOTBALL_API_KEY },
            params: {
                status: 'LIVE',
            },
        });
        return response.data.matches || [];
    }
    catch (error) {
        console.error('Failed to fetch live matches:', error);
        return [];
    }
};
exports.fetchLiveMatches = fetchLiveMatches;
const fetchMatchDetails = async (matchId) => {
    try {
        const response = await axios_1.default.get(`${FOOTBALL_API_BASE}/matches/${matchId}`, {
            headers: { 'X-Auth-Token': FOOTBALL_API_KEY },
        });
        return response.data;
    }
    catch (error) {
        console.error('Failed to fetch match details:', error);
        return null;
    }
};
exports.fetchMatchDetails = fetchMatchDetails;
const updateLiveMatch = async (eventId, matchData) => {
    try {
        const existingMatch = await prisma.liveMatch.findUnique({
            where: { eventId },
        });
        const matchEvents = matchData.goals || matchData.cards || [];
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
        }
        else {
            return await prisma.liveMatch.create({
                data: {
                    eventId,
                    ...data,
                },
            });
        }
    }
    catch (error) {
        console.error('Failed to update live match:', error);
        return null;
    }
};
exports.updateLiveMatch = updateLiveMatch;
const mapStatus = (apiStatus) => {
    switch (apiStatus) {
        case 'LIVE': return 'LIVE';
        case 'IN_PLAY': return 'LIVE';
        case 'PAUSED': return 'HALFTIME';
        case 'FINISHED': return 'FINISHED';
        case 'SCHEDULED': return 'NOT_STARTED';
        default: return 'NOT_STARTED';
    }
};
const pollLiveMatches = async () => {
    try {
        const liveMatches = await (0, exports.fetchLiveMatches)();
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
                await (0, exports.updateLiveMatch)(event.id, match);
                if (match.status === 'LIVE' && event.status !== 'LIVE') {
                    await prisma.event.update({
                        where: { id: event.id },
                        data: { status: 'LIVE' },
                    });
                }
            }
        }
        console.log(`Updated ${liveMatches.length} live matches`);
    }
    catch (error) {
        console.error('Polling error:', error);
    }
};
exports.pollLiveMatches = pollLiveMatches;
const startLiveMatchPolling = () => {
    console.log('Starting live match polling...');
    (0, exports.pollLiveMatches)();
    setInterval(async () => {
        await (0, exports.pollLiveMatches)();
    }, 30000);
};
exports.startLiveMatchPolling = startLiveMatchPolling;
