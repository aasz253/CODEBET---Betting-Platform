"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendComplianceReport = exports.exportAuditLog = exports.getResponsibleGamingReport = exports.getDailySummary = exports.getAuditLogs = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAuditLogs = async (req, res) => {
    try {
        const logs = await prisma.auditLog.findMany({
            take: 100,
            orderBy: { timestamp: 'desc' },
        });
        res.json({ logs });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};
exports.getAuditLogs = getAuditLogs;
const getDailySummary = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const bets = await prisma.bet.findMany({
            where: { createdAt: { gte: today } },
        });
        const totalStakes = bets.reduce((sum, bet) => sum + Number(bet.stake), 0);
        const houseProfit = totalStakes * 0.05;
        res.json({ totalBets: bets.length, totalStakes, houseProfit });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};
exports.getDailySummary = getDailySummary;
const getResponsibleGamingReport = async (req, res) => {
    try {
        const selfExcludedUsers = await prisma.selfExclusion.findMany({
            where: {
                OR: [
                    { excludedUntil: { gt: new Date() } },
                    { isPermanent: true },
                ],
            },
        });
        res.json({ selfExcludedUsers: selfExcludedUsers.length });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};
exports.getResponsibleGamingReport = getResponsibleGamingReport;
const exportAuditLog = async (req, res) => {
    res.json({ message: 'Export not implemented' });
};
exports.exportAuditLog = exportAuditLog;
const sendComplianceReport = async (req, res) => {
    res.json({ message: 'Send report not implemented' });
};
exports.sendComplianceReport = sendComplianceReport;
