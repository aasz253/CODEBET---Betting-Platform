"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkMonthlyLimit = exports.checkDailyLimit = exports.checkResponsibleGaming = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const checkResponsibleGaming = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return next();
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { selfExclusion: true },
        });
        if (!user)
            return next();
        const activeExclusion = user.selfExclusion?.excludedUntil && user.selfExclusion.excludedUntil > new Date() || user.selfExclusion?.isPermanent;
        if (activeExclusion) {
            return res.status(403).json({ error: 'You are excluded from betting' });
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.checkResponsibleGaming = checkResponsibleGaming;
const checkDailyLimit = async (req, res, next) => {
    next();
};
exports.checkDailyLimit = checkDailyLimit;
const checkMonthlyLimit = async (req, res, next) => {
    next();
};
exports.checkMonthlyLimit = checkMonthlyLimit;
