"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
require("winston-daily-rotate-file");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const walletRoutes_1 = __importDefault(require("./routes/walletRoutes"));
const oddsRoutes_1 = __importDefault(require("./routes/oddsRoutes"));
const betRoutes_1 = __importDefault(require("./routes/betRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const crashGamesRoutes_1 = __importDefault(require("./routes/crashGamesRoutes"));
const searchRoutes_1 = __importDefault(require("./routes/searchRoutes"));
const responsibleGamingRoutes_1 = __importDefault(require("./routes/responsibleGamingRoutes"));
const referralRoutes_1 = __importDefault(require("./routes/referralRoutes"));
const oddsService_1 = require("./services/oddsService");
const aviatorService_1 = require("./services/aviatorService");
const liveScoreService_1 = require("./services/liveScoreService");
const logger_1 = __importDefault(require("./utils/logger"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Request logging
app.use((req, res, next) => {
    logger_1.default.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    next();
});
app.get('/health', async (req, res) => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const Redis = require('ioredis');
    let dbStatus = 'ok';
    let redisStatus = 'ok';
    try {
        await prisma.$queryRaw `SELECT 1`;
    }
    catch (error) {
        dbStatus = 'error';
        console.error('Database health check failed:', error);
    }
    try {
        const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
        await redis.ping();
        redis.disconnect();
    }
    catch (error) {
        redisStatus = 'error';
        console.error('Redis health check failed:', error);
    }
    const status = dbStatus === 'ok' && redisStatus === 'ok' ? 200 : 503;
    res.status(status).json({
        status: status === 200 ? 'ok' : 'error',
        service: 'CODEBET-api',
        checks: {
            database: dbStatus,
            redis: redisStatus,
        },
        timestamp: new Date().toISOString(),
    });
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/wallet', walletRoutes_1.default);
app.use('/api/odds', oddsRoutes_1.default);
app.use('/api/bets', betRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/crash', crashGamesRoutes_1.default);
app.use('/api/search', searchRoutes_1.default);
app.use('/api/responsible', responsibleGamingRoutes_1.default);
app.use('/api/referral', referralRoutes_1.default);
const server = http_1.default.createServer(app);
(0, oddsService_1.initializeOddsWebSocket)(server);
(0, aviatorService_1.initializeAviatorWebSocket)(server);
(0, liveScoreService_1.startLiveMatchPolling)();
server.listen(PORT, () => {
    logger_1.default.info(`Server running on port ${PORT}`);
});
exports.default = app;
