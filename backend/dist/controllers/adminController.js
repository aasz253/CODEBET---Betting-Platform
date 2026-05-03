"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = exports.getDashboardStats = exports.setBetLimits = exports.getAuditLog = exports.adjustOdds = exports.suspendUser = exports.setHouseMargin = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const setHouseMargin = async (req, res) => {
    try {
        const { sport, league, margin } = req.body;
        if (!margin || parseFloat(margin) < 0 || parseFloat(margin) > 100) {
            return res.status(400).json({ error: 'Valid margin percentage (0-100) is required' });
        }
        const houseMargin = await prisma.houseMargin.create({
            data: {
                sport: sport || null,
                league: league || null,
                margin: parseFloat(margin)
            }
        });
        return res.status(201).json({
            message: 'House margin set successfully',
            houseMargin
        });
    }
    catch (error) {
        console.error('Set house margin error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.setHouseMargin = setHouseMargin;
const suspendUser = async (req, res) => {
    try {
        const { userId, reason } = req.body;
        const adminId = req.user?.userId;
        if (!userId || !reason) {
            return res.status(400).json({ error: 'User ID and reason are required' });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.role === client_1.UserRole.ADMIN) {
            return res.status(403).json({ error: 'Cannot suspend admin users' });
        }
        const existingSuspension = await prisma.suspendedUser.findUnique({
            where: { userId }
        });
        if (existingSuspension) {
            return res.status(400).json({ error: 'User is already suspended' });
        }
        const suspension = await prisma.$transaction(async (tx) => {
            const suspended = await tx.suspendedUser.create({
                data: {
                    userId,
                    reason,
                    suspendedBy: adminId || 'unknown'
                }
            });
            return suspended;
        });
        return res.status(200).json({
            message: 'User suspended successfully',
            suspension
        });
    }
    catch (error) {
        console.error('Suspend user error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.suspendUser = suspendUser;
const adjustOdds = async (req, res) => {
    try {
        const { eventId, marketId, oddsValue, isActive } = req.body;
        if (!eventId || !marketId || !oddsValue) {
            return res.status(400).json({ error: 'Event ID, market ID, and odds value are required' });
        }
        const event = await prisma.event.findUnique({
            where: { id: eventId }
        });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        const market = await prisma.market.findUnique({
            where: { id: marketId }
        });
        if (!market || market.eventId !== eventId) {
            return res.status(404).json({ error: 'Market not found for this event' });
        }
        const adjustedOdds = await prisma.$transaction(async (tx) => {
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
        return res.status(200).json({
            message: 'Odds adjusted successfully',
            odds: adjustedOdds
        });
    }
    catch (error) {
        console.error('Adjust odds error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.adjustOdds = adjustOdds;
const getAuditLog = async (req, res) => {
    try {
        const { userId, startDate, endDate, page = '1', limit = '50' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (userId) {
            where.userId = userId;
        }
        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }
        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum,
                include: {
                    user: {
                        select: {
                            id: true,
                            phoneNumber: true,
                            fullName: true
                        }
                    }
                }
            }),
            prisma.transaction.count({ where })
        ]);
        return res.status(200).json({
            transactions,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    }
    catch (error) {
        console.error('Get audit log error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAuditLog = getAuditLog;
const setBetLimits = async (req, res) => {
    try {
        const { userId, minStake, maxStake } = req.body;
        if (!minStake || !maxStake) {
            return res.status(400).json({ error: 'Min and max stake are required' });
        }
        if (parseFloat(minStake) >= parseFloat(maxStake)) {
            return res.status(400).json({ error: 'Min stake must be less than max stake' });
        }
        const betLimit = await prisma.betLimit.create({
            data: {
                userId: userId || null,
                minStake: parseFloat(minStake),
                maxStake: parseFloat(maxStake)
            }
        });
        return res.status(201).json({
            message: 'Bet limits set successfully',
            betLimit
        });
    }
    catch (error) {
        console.error('Set bet limits error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.setBetLimits = setBetLimits;
const getDashboardStats = async (req, res) => {
    try {
        const [totalUsers, activeBets, totalVolume, totalPayouts, dailyVolume] = await Promise.all([
            prisma.user.count(),
            prisma.bet.count({
                where: { status: 'PENDING' }
            }),
            prisma.transaction.aggregate({
                where: { type: 'BET', status: 'COMPLETED' },
                _sum: { amount: true }
            }),
            prisma.transaction.aggregate({
                where: { type: 'WIN', status: 'COMPLETED' },
                _sum: { amount: true }
            }),
            prisma.$queryRaw `
        SELECT 
          DATE(created_at) as date,
          SUM(amount) as volume
        FROM transactions
        WHERE type = 'BET' AND status = 'COMPLETED'
          AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 7
      `
        ]);
        return res.status(200).json({
            totalUsers,
            activeBets,
            totalVolume: totalVolume._sum.amount || 0,
            totalPayouts: totalPayouts._sum.amount || 0,
            dailyVolume: dailyVolume || []
        });
    }
    catch (error) {
        console.error('Get dashboard stats error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getDashboardStats = getDashboardStats;
const getUsers = async (req, res) => {
    try {
        const { phoneNumber } = req.query;
        const where = {};
        if (phoneNumber) {
            where.phoneNumber = { contains: phoneNumber };
        }
        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                phoneNumber: true,
                fullName: true,
                isVerified: true,
                isAgeVerified: true,
                role: true,
                createdAt: true,
            }
        });
        return res.status(200).json(users);
    }
    catch (error) {
        console.error('Get users error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getUsers = getUsers;
