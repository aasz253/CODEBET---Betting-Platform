import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import winston from 'winston';
import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';
import authRoutes from './routes/authRoutes';
import walletRoutes from './routes/walletRoutes';
import oddsRoutes from './routes/oddsRoutes';
import betRoutes from './routes/betRoutes';
import adminRoutes from './routes/adminRoutes';
import crashGamesRoutes from './routes/crashGamesRoutes';
import searchRoutes from './routes/searchRoutes';
import responsibleGamingRoutes from './routes/responsibleGamingRoutes';
import referralRoutes from './routes/referralRoutes';
import complianceRoutes from './routes/complianceRoutes';
import { initializeOddsWebSocket } from './services/oddsService';
import { initializeAviatorWebSocket } from './services/aviatorService';
import { startLiveMatchPolling } from './services/liveScoreService';
import logger from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
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
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbStatus = 'error';
    console.error('Database health check failed:', error);
  }

  try {
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    await redis.ping();
    redis.disconnect();
  } catch (error) {
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

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/odds', oddsRoutes);
app.use('/api/bets', betRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/crash', crashGamesRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/responsible', responsibleGamingRoutes);
app.use('/api/referral', referralRoutes);

const server = http.createServer(app);
initializeOddsWebSocket(server);
initializeAviatorWebSocket(server);
startLiveMatchPolling();

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;
