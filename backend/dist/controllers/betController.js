"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateWin = exports.getBetHistory = exports.placeBet = exports.createBetSlip = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createBetSlip = async (req, res) => {
    try {
        const { userId, bets, betType } = req.body;
        if (!userId || !bets || !Array.isArray(bets) || bets.length === 0) {
            return res.status(400).json({ error: 'User ID and bets array are required' });
        }
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const totalStake = bets.reduce((sum, bet) => sum + parseFloat(bet.stake), 0);
        const totalPotentialWin = totalStake * 2; // Simplified calculation
        const betSlip = await prisma.betSlip.create({
            data: {
                userId,
                totalStake,
                totalPotentialWin,
                betType: betType || client_1.BetType.SINGLE,
                isPlaced: false,
            }
        });
        res.status(201).json({ betSlip, bets: [] });
    }
    catch (error) {
        console.error('Create bet slip error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createBetSlip = createBetSlip;
const placeBet = async (req, res) => {
    try {
        const { betSlipId } = req.body;
        const betSlip = await prisma.betSlip.findUnique({
            where: { id: betSlipId },
        });
        if (!betSlip) {
            return res.status(404).json({ error: 'Bet slip not found' });
        }
        await prisma.betSlip.update({
            where: { id: betSlipId },
            data: { isPlaced: true },
        });
        res.json({ message: 'Bet placed successfully' });
    }
    catch (error) {
        console.error('Place bet error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.placeBet = placeBet;
const getBetHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const betSlips = await prisma.betSlip.findMany({
            where: { userId: userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ betSlips });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getBetHistory = getBetHistory;
const calculateWin = async (req, res) => {
    try {
        res.json({ message: 'Calculate win not implemented' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.calculateWin = calculateWin;
