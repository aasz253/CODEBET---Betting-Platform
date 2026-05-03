import { Request, Response } from 'express';
import { getBalance, deposit } from '../controllers/walletController';
import { PrismaClient } from '@prisma/client';

// Mock the referral controller functions
jest.mock('../controllers/referralController', () => ({
  checkWelcomeBonus: jest.fn(),
  checkDepositBonus: jest.fn(),
}));

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    wallet: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback({
      wallet: {
        findUnique: jest.fn().mockResolvedValue({ balance: 0 }),
        update: jest.fn().mockResolvedValue({ balance: 1000 }),
      },
      transaction: {
        create: jest.fn().mockResolvedValue({ id: 'tx-1' }),
      },
    })),
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    TransactionType: { DEPOSIT: 'DEPOSIT', WITHDRAW: 'WITHDRAW' },
    TransactionStatus: { PENDING: 'PENDING', COMPLETED: 'COMPLETED' },
  };
});

describe('Wallet Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let prisma: any;

  beforeEach(() => {
    prisma = new PrismaClient();
    mockReq = {
      user: { userId: 'user-1' },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('should return 401 if user not authenticated', async () => {
      mockReq.user = undefined;
      
      await getBalance(mockReq as any, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return balance if user exists', async () => {
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue({
        balance: 5000,
      });
      
      await getBalance(mockReq as any, mockRes as Response);
      
      expect(mockRes.json).toHaveBeenCalledWith({ balance: 5000 });
    });
  });

  describe('deposit', () => {
    it('should return 400 if amount is less than 1 KES', async () => {
      mockReq.body = { phoneNumber: '0722000000', amount: 0.5 };
      
      await deposit(mockReq as any, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should process deposit successfully', async () => {
      mockReq.body = { phoneNumber: '0722000000', amount: 1000 };
      
      await deposit(mockReq as any, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
