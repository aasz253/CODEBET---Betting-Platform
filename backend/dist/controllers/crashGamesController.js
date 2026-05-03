"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGameHistory = exports.cashOut = exports.placeBet = exports.createGameSession = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createGameSession = async (req, res) => {
    try {
        const { gameType } = req.body;
        if (!gameType) {
            return res.status(400).json({ error: 'Game type is required' });
        }
        const crashPoint = generateCrashPoint();
        const gameSession = await prisma.$executeRaw `
      INSERT INTO crash_game_sessions (id, game_type, crash_point, created_at)
      VALUES (gen_random_uuid(), ${gameType}, ${crashPoint}, NOW())
    `;
        return res.status(201).json({
            message: 'Game session created',
            crashPoint,
            gameType
        });
    }
    catch (error) {
        console.error('Create game session error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createGameSession = createGameSession;
const placeBet = async (req, res) => {
    try {
        const { userId, gameType, betAmount } = req.body;
        if (!userId || !gameType || !betAmount) {
            return res.status(400).json({ error: 'User ID, game type, and bet amount are required' });
        }
        const betAmountNum = parseFloat(betAmount);
        if (betAmountNum <= 0) {
            return res.status(400).json({ error: 'Invalid bet amount' });
        }
        const wallet = await prisma.wallet.findUnique({
            where: { userId }
        });
        if (!wallet || parseFloat(wallet.balance.toString()) < betAmountNum) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        const bet = await prisma.$executeRaw `
      INSERT INTO crash_game_bets (id, user_id, game_type, bet_amount, status, created_at)
      VALUES (gen_random_uuid(), ${userId}, ${gameType}, ${betAmountNum}, 'ACTIVE', NOW())
    `;
        await prisma.wallet.update({
            where: { userId },
            data: { balance: { decrement: betAmountNum } }
        });
        await prisma.transaction.create({
            data: {
                userId,
                type: 'BET',
                amount: betAmountNum,
                status: 'COMPLETED',
                reference: `CRASH-${Date.now()}-${Math.random().toString(36).substring(7)}`
            }
        });
        return res.status(200).json({
            message: 'Bet placed successfully',
            bet: {
                userId,
                gameType,
                betAmount: betAmountNum,
                status: 'ACTIVE'
            }
        });
    }
    catch (error) {
        console.error('Place bet error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.placeBet = placeBet;
const cashOut = async (req, res) => {
    try {
        const { userId, gameType, multiplier } = req.body;
        if (!userId || !gameType || !multiplier) {
            return res.status(400).json({ error: 'User ID, game type, and multiplier are required' });
        }
        const bet = await prisma.$queryRaw `
      SELECT * FROM crash_game_bets 
      WHERE user_id = ${userId} 
        AND game_type = ${gameType} 
        AND status = 'ACTIVE'
      ORDER BY created_at DESC
      LIMIT 1
    `;
        if (!bet || bet.length === 0) {
            return res.status(404).json({ error: 'No active bet found' });
        }
        const currentBet = bet[0];
        const cashOutAmount = parseFloat(currentBet.bet_amount) * parseFloat(multiplier);
        const profit = cashOutAmount - parseFloat(currentBet.bet_amount);
        await prisma.$executeRaw `
      UPDATE crash_game_bets 
      SET status = 'CASHED_OUT', 
          cash_out_multiplier = ${parseFloat(multiplier)}, 
          profit = ${profit},
          updated_at = NOW()
      WHERE id = ${currentBet.id}
    `;
        await prisma.wallet.update({
            where: { userId },
            data: { balance: { increment: cashOutAmount } }
        });
        await prisma.transaction.create({
            data: {
                userId,
                type: 'WIN',
                amount: cashOutAmount,
                status: 'COMPLETED',
                reference: `CASHOUT-${Date.now()}-${Math.random().toString(36).substring(7)}`
            }
        });
        return res.status(200).json({
            message: 'Cash out successful',
            cashOutAt: parseFloat(multiplier),
            profit,
            totalWon: cashOutAmount
        });
    }
    catch (error) {
        console.error('Cash out error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.cashOut = cashOut;
const getGameHistory = async (req, res) => {
    try {
        const { gameType, userId, page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (gameType)
            where.game_type = gameType;
        if (userId)
            where.user_id = userId;
        const bets = await prisma.$queryRaw `
      SELECT 
        cgb.*,
        u.full_name,
        u.phone_number
      FROM crash_game_bets cgb
      LEFT JOIN users u ON cgb.user_id = u.id
      ORDER BY cgb.created_at DESC
      LIMIT ${limitNum} OFFSET ${skip}
    `;
        const total = await prisma.$queryRaw `
      SELECT COUNT(*) as count FROM crash_game_bets
    `;
        return res.status(200).json({
            bets,
            pagination: {
                total: Number(total[0].count),
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(Number(total[0].count) / limitNum)
            }
        });
    }
    catch (error) {
        console.error('Get game history error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getGameHistory = getGameHistory;
const generateCrashPoint = () => {
    const random = Math.random();
    const maxCrash = 1000;
    const crashPoint = Math.floor(Math.exp(random * Math.log(maxCrash)) * 100) / 100;
    return Math.max(1.00, crashPoint);
};
