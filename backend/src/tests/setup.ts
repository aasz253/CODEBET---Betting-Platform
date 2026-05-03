import { PrismaClient } from '@prisma/client';

// Mock Prisma client
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      wallet: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      transaction: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      betSlip: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      bet: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback({
        odds: {
          updateMany: jest.fn(),
          create: jest.fn(),
        },
      })),
    })),
    BetType: { SINGLE: 'SINGLE', MULTI: 'MULTI', SYSTEM: 'SYSTEM' },
    BetStatus: { PENDING: 'PENDING', WON: 'WON', LOST: 'LOST' },
    TransactionType: { DEPOSIT: 'DEPOSIT', WITHDRAW: 'WITHDRAW', BET: 'BET', WIN: 'WIN' },
    TransactionStatus: { PENDING: 'PENDING', COMPLETED: 'COMPLETED', FAILED: 'FAILED' },
    EventStatus: { PENDING: 'PENDING', LIVE: 'LIVE', FINISHED: 'FINISHED', CANCELLED: 'CANCELLED' },
    MarketType: { MATCH_WINNER: 'MATCH_WINNER', OVER_UNDER: 'OVER_UNDER' },
  };
});

// Global test setup
beforeAll(async () => {
  // Initialize any global test setup
});

afterAll(async () => {
  // Cleanup
});

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
