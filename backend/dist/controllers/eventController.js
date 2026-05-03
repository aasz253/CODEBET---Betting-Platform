"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeagues = exports.getSports = exports.getEvents = exports.getLiveMatch = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getLiveMatch = async (req, res) => {
    try {
        const { eventId } = req.params;
        const liveMatch = await prisma.liveMatch.findUnique({
            where: { eventId: eventId },
        });
        if (!liveMatch) {
            return res.status(404).json({ error: 'Live match not found' });
        }
        const events = JSON.parse(liveMatch.events?.toString() || '[]');
        res.json({
            id: liveMatch.id,
            eventId: liveMatch.eventId,
            homeScore: liveMatch.homeScore,
            awayScore: liveMatch.awayScore,
            matchTime: liveMatch.matchTime,
            status: liveMatch.status,
            events: events,
            homePossession: liveMatch.homePossession,
            awayPossession: liveMatch.awayPossession,
            homeShots: liveMatch.homeShots,
            awayShots: liveMatch.awayShots,
            homeCorners: liveMatch.homeCorners,
            awayCorners: liveMatch.awayCorners,
        });
    }
    catch (error) {
        console.error('Get live match error:', error);
        res.status(500).json({ error: 'Failed to fetch live match' });
    }
};
exports.getLiveMatch = getLiveMatch;
const getEvents = async (req, res) => {
    try {
        const { sport, league, time, sortBy } = req.query;
        const where = {
            status: { not: 'CANCELLED' },
        };
        if (sport && sport !== 'all') {
            where.sport = sport;
        }
        if (league && league !== 'all') {
            where.league = league;
        }
        if (time && time !== 'all') {
            const now = new Date();
            switch (time) {
                case 'today':
                    const tomorrow = new Date(now);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(0, 0, 0, 0);
                    where.startTime = {
                        gte: now,
                        lt: tomorrow,
                    };
                    break;
                case 'tomorrow':
                    const startTomorrow = new Date(now);
                    startTomorrow.setDate(startTomorrow.getDate() + 1);
                    startTomorrow.setHours(0, 0, 0, 0);
                    const dayAfter = new Date(startTomorrow);
                    dayAfter.setDate(dayAfter.getDate() + 1);
                    where.startTime = {
                        gte: startTomorrow,
                        lt: dayAfter,
                    };
                    break;
                case 'live':
                    where.status = 'LIVE';
                    break;
            }
        }
        let orderBy = { startTime: 'asc' };
        if (sortBy === 'popularity') {
            orderBy = { bets: { _count: 'desc' } };
        }
        const events = await prisma.event.findMany({
            where,
            include: {
                markets: {
                    include: {
                        odds: {
                            where: { isActive: true, current: true },
                        },
                    },
                },
                _count: {
                    select: { bets: true },
                },
            },
            orderBy,
        });
        const results = events.map((event) => ({
            id: event.id,
            sport: event.sport,
            league: event.league,
            homeTeam: event.homeTeam,
            awayTeam: event.awayTeam,
            startTime: event.startTime,
            status: event.status,
            betCount: event._count.bets,
            markets: event.markets.map((market) => ({
                id: market.id,
                type: market.type,
                name: market.name,
                odds: market.odds.map((odd) => ({
                    id: odd.id,
                    value: Number(odd.value),
                    isActive: odd.isActive,
                })),
            })),
        }));
        res.json({ events: results });
    }
    catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};
exports.getEvents = getEvents;
const getSports = async (req, res) => {
    try {
        const sports = await prisma.event.findMany({
            select: { sport: true },
            distinct: ['sport'],
            where: { status: { not: 'CANCELLED' } },
        });
        res.json({ sports: sports.map((s) => s.sport) });
    }
    catch (error) {
        console.error('Get sports error:', error);
        res.status(500).json({ error: 'Failed to fetch sports' });
    }
};
exports.getSports = getSports;
const getLeagues = async (req, res) => {
    try {
        const { sport } = req.query;
        const where = { status: { not: 'CANCELLED' } };
        if (sport && sport !== 'all') {
            where.sport = sport;
        }
        const leagues = await prisma.event.findMany({
            where,
            select: { league: true },
            distinct: ['league'],
        });
        res.json({ leagues: leagues.map((l) => l.league) });
    }
    catch (error) {
        console.error('Get leagues error:', error);
        res.status(500).json({ error: 'Failed to fetch leagues' });
    }
};
exports.getLeagues = getLeagues;
