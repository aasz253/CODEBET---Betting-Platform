"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logLimitChange = exports.logUserSuspension = exports.logOddsChange = exports.logLoginAttempt = exports.logTransaction = exports.logBetPlacement = exports.auditMiddleware = exports.createAuditLog = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createAuditLog = async (data) => {
    try {
        await prisma.auditLog.create({
            data: {
                userId: data.userId,
                action: data.action,
                entity: data.entity,
                entityId: data.entityId,
                oldValue: data.oldValue,
                newValue: data.newValue,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            },
        });
    }
    catch (error) {
        console.error('Audit log creation failed:', error);
    }
};
exports.createAuditLog = createAuditLog;
const auditMiddleware = (action, entity) => {
    return async (req, res, next) => {
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const userId = req.user?.id;
                const ipAddress = req.ip || req.socket.remoteAddress;
                const userAgent = req.get('User-Agent');
                (0, exports.createAuditLog)({
                    userId,
                    action,
                    entity,
                    entityId: req.params.id || req.body.id,
                    oldValue: null,
                    newValue: { body: req.body, params: req.params },
                    ipAddress,
                    userAgent,
                });
            }
            return originalJson(body);
        };
        next();
    };
};
exports.auditMiddleware = auditMiddleware;
const logBetPlacement = async (userId, betData, ipAddress, userAgent) => {
    await (0, exports.createAuditLog)({
        userId,
        action: 'BET_PLACED',
        entity: 'Bet',
        entityId: betData.betSlipId,
        newValue: {
            stakes: betData.bets?.map((b) => ({
                eventId: b.eventId,
                marketId: b.marketId,
                stake: b.stake,
                oddsValue: b.oddsValue,
            })),
            totalStake: betData.totalStake,
            potentialWin: betData.totalPotentialWin,
        },
        ipAddress,
        userAgent,
    });
};
exports.logBetPlacement = logBetPlacement;
const logTransaction = async (userId, type, amount, method, reference, ipAddress) => {
    await (0, exports.createAuditLog)({
        userId,
        action: type === 'DEPOSIT' ? 'DEPOSIT' : 'WITHDRAWAL',
        entity: 'Transaction',
        newValue: {
            type,
            amount,
            method,
            reference,
        },
        ipAddress,
    });
};
exports.logTransaction = logTransaction;
const logLoginAttempt = async (phoneNumber, success, ipAddress, userAgent) => {
    await (0, exports.createAuditLog)({
        action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILURE',
        entity: 'User',
        newValue: {
            phoneNumber,
            success,
        },
        ipAddress,
        userAgent,
    });
};
exports.logLoginAttempt = logLoginAttempt;
const logOddsChange = async (adminId, eventId, marketId, oldOdds, newOdds) => {
    await (0, exports.createAuditLog)({
        userId: adminId,
        action: 'ODDS_CHANGE',
        entity: 'Odds',
        entityId: marketId,
        oldValue: { odds: oldOdds },
        newValue: { odds: newOdds },
    });
};
exports.logOddsChange = logOddsChange;
const logUserSuspension = async (adminId, userId, reason) => {
    await (0, exports.createAuditLog)({
        userId: adminId,
        action: 'USER_SUSPENDED',
        entity: 'User',
        entityId: userId,
        newValue: { reason },
    });
};
exports.logUserSuspension = logUserSuspension;
const logLimitChange = async (adminId, userId, limitType, oldValue, newValue) => {
    await (0, exports.createAuditLog)({
        userId: adminId,
        action: 'LIMIT_CHANGE',
        entity: 'User',
        entityId: userId,
        oldValue: { [limitType]: oldValue },
        newValue: { [limitType]: newValue },
    });
};
exports.logLimitChange = logLimitChange;
