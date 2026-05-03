import { Request, Response } from 'express';
import { register, login } from '../controllers/authController';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    wallet: {
      create: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    UserRole: { USER: 'USER', ADMIN: 'ADMIN' },
  };
});

describe('Auth Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let prisma: any;

  beforeEach(() => {
    prisma = new PrismaClient();
    mockReq = {
      body: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should return 400 if required fields are missing', async () => {
      mockReq.body = { phoneNumber: '0722000000' };
      
      await register(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 409 if user already exists', async () => {
      mockReq.body = {
        phoneNumber: '0722000000',
        password: 'password',
        fullName: 'Test User',
        idNumber: '12345678',
        dateOfBirth: '2000-01-01',
        confirmAge: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
      
      await register(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(409);
    });

    it('should register user successfully', async () => {
      mockReq.body = {
        phoneNumber: '0722000000',
        password: 'password',
        fullName: 'Test User',
        idNumber: '12345678',
        dateOfBirth: '2000-01-01',
        confirmAge: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        phoneNumber: '0722000000',
        fullName: 'Test User',
        isAgeVerified: true,
        role: 'USER',
      });
      
      await register(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(prisma.user.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return 400 if phone or password missing', async () => {
      mockReq.body = { phoneNumber: '0722000000' };
      
      await login(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 401 if user not found', async () => {
      mockReq.body = { phoneNumber: '0722000000', password: 'password' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      
      await login(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });
});
