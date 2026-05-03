"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactionHistory = exports.withdraw = exports.deposit = exports.getBalance = void 0;
const client_1 = require("@prisma/client");
const referralController_1 = require("../controllers/referralController");
const prisma = new client_1.PrismaClient();
const getBalance = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const wallet = await prisma.wallet.findUnique({
            where: { userId }
        });
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }
        return res.status(200).json({
            balance: wallet.balance,
            userId: wallet.userId
        });
    }
    catch (error) {
        console.error('Get balance error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getBalance = getBalance;
const deposit = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { amount } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!amount || parseFloat(amount) < 1) {
            return res.status(400).json({ error: 'Minimum deposit amount is 1 KES' });
        }
        const depositAmount = parseFloat(amount);
        const reference = `DEP-${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const result = await prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({
                where: { userId }
            });
            if (!wallet) {
                throw new Error('Wallet not found');
            }
            const updatedWallet = await tx.wallet.update({
                where: { userId },
                data: { balance: { increment: depositAmount } }
            });
            const transaction = await tx.transaction.create({
                data: {
                    userId,
                    type: client_1.TransactionType.DEPOSIT,
                    amount: depositAmount,
                    status: client_1.TransactionStatus.COMPLETED,
                    reference
                }
            });
            return { wallet: updatedWallet, transaction };
        });
        (0, referralController_1.checkWelcomeBonus)(userId, depositAmount);
        (0, referralController_1.checkDepositBonus)(userId, depositAmount);
        return res.status(200).json({
            message: 'Deposit successful',
            balance: result.wallet.balance,
            transaction: {
                id: result.transaction.id,
                reference: result.transaction.reference,
                amount: result.transaction.amount,
                type: result.transaction.type,
                status: result.transaction.status
            }
        });
    }
    catch (error) {
        console.error('Deposit error:', error);
        if (error.message === 'Wallet not found') {
            return res.status(404).json({ error: 'Wallet not found' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deposit = deposit;
const withdraw = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { amount } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ error: 'Valid withdrawal amount is required' });
        }
        const withdrawAmount = parseFloat(amount);
        const reference = `WDL-${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const result = await prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({
                where: { userId }
            });
            if (!wallet) {
                throw new Error('Wallet not found');
            }
            const currentBalance = parseFloat(wallet.balance.toString());
            if (currentBalance < withdrawAmount) {
                throw new Error('Insufficient balance');
            }
            const updatedWallet = await tx.wallet.update({
                where: { userId },
                data: { balance: { decrement: withdrawAmount } }
            });
            const transaction = await tx.transaction.create({
                data: {
                    userId,
                    type: client_1.TransactionType.WITHDRAW,
                    amount: withdrawAmount,
                    status: client_1.TransactionStatus.COMPLETED,
                    reference
                }
            });
            return { wallet: updatedWallet, transaction };
        });
        return res.status(200).json({
            message: 'Withdrawal successful',
            balance: result.wallet.balance,
            transaction: {
                id: result.transaction.id,
                reference: result.transaction.reference,
                amount: result.transaction.amount,
                type: result.transaction.type,
                status: result.transaction.status
            }
        });
    }
    catch (error) {
        console.error('Withdraw error:', error);
        if (error.message === 'Wallet not found') {
            return res.status(404).json({ error: 'Wallet not found' });
        }
        if (error.message === 'Insufficient balance') {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.withdraw = withdraw;
const getTransactionHistory = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { page = '1', limit = '10' } = req.query;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum
            }),
            prisma.transaction.count({
                where: { userId }
            })
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
        console.error('Get transaction history error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getTransactionHistory = getTransactionHistory;
