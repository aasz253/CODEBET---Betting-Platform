"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token)
            return res.status(401).json({ error: 'No token provided' });
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
// Get responsible gaming settings
router.get('/settings', authenticate, async (req, res) => {
    try {
        const settings = await prisma.responsibleGamingSettings.findUnique({
            where: { userId: req.userId },
        });
        if (!settings) {
            const newSettings = await prisma.responsibleGamingSettings.create({
                data: {
                    userId: req.userId,
                    dailyLossLimit: 100000,
                    monthlyDepositLimit: 500000,
                },
            });
            return res.json(newSettings);
        }
        res.json(settings);
    }
    catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Failed to get settings' });
    }
});
// Update responsible gaming settings (only allow lowering limits)
router.put('/settings', authenticate, async (req, res) => {
    try {
        const { dailyLossLimit, monthlyDepositLimit } = req.body;
        const currentSettings = await prisma.responsibleGamingSettings.findUnique({
            where: { userId: req.userId },
        });
        if (!currentSettings) {
            return res.status(404).json({ error: 'Settings not found' });
        }
        // Only allow lowering limits, not increasing
        const updates = {};
        if (dailyLossLimit && dailyLossLimit < Number(currentSettings.dailyLossLimit)) {
            updates.dailyLossLimit = dailyLossLimit;
        }
        if (monthlyDepositLimit && monthlyDepositLimit < Number(currentSettings.monthlyDepositLimit)) {
            updates.monthlyDepositLimit = monthlyDepositLimit;
        }
        const updated = await prisma.responsibleGamingSettings.update({
            where: { userId: req.userId },
            data: updates,
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});
// Take a 10-minute break (voluntary cool-down)
router.post('/cool-down', authenticate, async (req, res) => {
    try {
        const coolDownUntil = new Date();
        coolDownUntil.setMinutes(coolDownUntil.getMinutes() + 10);
        await prisma.responsibleGamingSettings.upsert({
            where: { userId: req.userId },
            update: { coolDownUntil },
            create: {
                userId: req.userId,
                dailyLossLimit: 100000,
                monthlyDepositLimit: 500000,
                coolDownUntil,
            },
        });
        res.json({ message: 'Cool-down period set for 10 minutes', coolDownUntil });
    }
    catch (error) {
        console.error('Cool-down error:', error);
        res.status(500).json({ error: 'Failed to set cool-down' });
    }
});
// Self-exclusion (24 hours, 7 days, or permanent)
router.post('/self-exclusion', authenticate, async (req, res) => {
    try {
        const { duration } = req.body; // '24h', '7d', or 'permanent'
        let excludedUntil = null;
        let isPermanent = false;
        if (duration === '24h') {
            excludedUntil = new Date();
            excludedUntil.setHours(excludedUntil.getHours() + 24);
        }
        else if (duration === '7d') {
            excludedUntil = new Date();
            excludedUntil.setDate(excludedUntil.getDate() + 7);
        }
        else if (duration === 'permanent') {
            isPermanent = true;
        }
        else {
            return res.status(400).json({ error: 'Invalid duration' });
        }
        await prisma.selfExclusion.upsert({
            where: { userId: req.userId },
            update: {
                excludedUntil,
                isPermanent,
            },
            create: {
                userId: req.userId,
                excludedUntil,
                isPermanent,
            },
        });
        res.json({ message: 'Self-exclusion activated', excludedUntil, isPermanent });
    }
    catch (error) {
        console.error('Self-exclusion error:', error);
        res.status(500).json({ error: 'Failed to set self-exclusion' });
    }
});
// Dismiss age warning
router.post('/age-warning-dismissed', authenticate, async (req, res) => {
    try {
        await prisma.user.update({
            where: { id: req.userId },
            data: { ageWarningShown: true },
        });
        res.json({ message: 'Age warning dismissed' });
    }
    catch (error) {
        console.error('Dismiss age warning error:', error);
        res.status(500).json({ error: 'Failed to dismiss warning' });
    }
});
// Reality check - get time played and total wagered
router.get('/reality-check', authenticate, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
        });
        if (!user?.firstLoginAt) {
            return res.json({ timePlayed: 0, totalWagered: 0 });
        }
        const timePlayed = Date.now() - user.firstLoginAt.getTime();
        const totalWagered = await prisma.transaction.aggregate({
            where: {
                userId: req.userId,
                type: 'BET',
                status: 'COMPLETED',
            },
            _sum: { amount: true },
        });
        res.json({
            timePlayed: Math.floor(timePlayed / 60000),
            totalWagered: Number(totalWagered._sum.amount || 0),
        });
    }
    catch (error) {
        console.error('Reality check error:', error);
        res.status(500).json({ error: 'Failed to get reality check data' });
    }
});
exports.default = router;
