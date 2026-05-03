"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventMarkets = exports.getLiveOdds = exports.updateOdds = void 0;
const client_1 = require("@prisma/client");
const oddsService_1 = require("../services/oddsService");
const prisma = new client_1.PrismaClient();
const updateOdds = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { marketId, oddsValue, isActive } = req.body;
        if (!marketId || !oddsValue) {
            return res.status(400).json({ error: 'Market ID and odds value are required' });
        }
        const event = await prisma.event.findUnique({
            where: { id: eventId }
        });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        if (event.status !== 'LIVE' && event.status !== 'PENDING') {
            return res.status(400).json({ error: 'Cannot update odds for finished or cancelled events' });
        }
        const market = await prisma.market.findUnique({
            where: { id: marketId }
        });
        if (!market || market.eventId !== eventId) {
            return res.status(404).json({ error: 'Market not found for this event' });
        }
        const updatedOdds = await prisma.$transaction(async (tx) => {
            await tx.odds.updateMany({
                where: { marketId, current: true },
                data: { current: false }
            });
            const newOdds = await tx.odds.create({
                data: {
                    marketId,
                    value: parseFloat(oddsValue),
                    current: true,
                    isActive: isActive !== undefined ? isActive : true
                }
            });
            return newOdds;
        });
        await (0, oddsService_1.publishOddsUpdate)(eventId, marketId, {
            marketId,
            oddsId: updatedOdds.id,
            value: updatedOdds.value,
            isActive: updatedOdds.isActive,
            previousValue: null
        });
        return res.status(200).json({
            message: 'Odds updated successfully',
            odds: updatedOdds
        });
    }
    catch (error) {
        console.error('Update odds error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateOdds = updateOdds;
const getLiveOdds = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        const markets = await prisma.market.findMany({
            where: { eventId: event.id },
            include: { odds: { where: { current: true, isActive: true } } },
        });
        const oddsData = markets.map((market) => ({
            marketId: market.id,
            marketType: market.type,
            marketName: market.name,
            odds: market.odds.map((odd) => ({
                id: odd.id,
                value: odd.value,
                label: odd.label,
                isActive: odd.isActive,
            })),
        }));
        res.json({ eventId: event.id, odds: oddsData });
    }
    catch (error) {
        console.error('Get live odds error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getLiveOdds = getLiveOdds;
const getEventMarkets = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        const markets = await prisma.market.findMany({
            where: { eventId: event.id },
            include: { odds: { orderBy: { createdAt: 'desc' }, take: 1 } },
        });
        const marketsData = markets.map((market) => ({
            id: market.id,
            type: market.type,
            name: market.name,
            currentOdds: market.odds[0] ? {
                value: market.odds[0].value,
                isActive: market.odds[0].isActive,
                updatedAt: market.odds[0].updatedAt,
            } : null,
        }));
        return res.status(200).json({
            eventId: event.id,
            event: `${event.homeTeam} vs ${event.awayTeam}`,
            league: event.league,
            startTime: event.startTime,
            status: event.status,
            markets: marketsData,
        });
    }
    catch (error) {
        console.error('Get event markets error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getEventMarkets = getEventMarkets;
