"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const walletController_1 = require("../controllers/walletController");
const client_1 = require("@prisma/client");
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
    let mockReq;
    let mockRes;
    let prisma;
    beforeEach(() => {
        prisma = new client_1.PrismaClient();
        mockReq = {
            user: { userId: 'user-1', phoneNumber: '0792325646', role: 'USER', isAgeVerified: true },
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
            await (0, walletController_1.getBalance)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(401);
        });
        it('should return balance if user exists', async () => {
            prisma.wallet.findUnique.mockResolvedValue({
                balance: 5000,
            });
            await (0, walletController_1.getBalance)(mockReq, mockRes);
            expect(mockRes.json).toHaveBeenCalledWith({ balance: 5000 });
        });
    });
    describe('deposit', () => {
        it('should return 400 if amount is less than 1 KES', async () => {
            mockReq.body = { phoneNumber: '0722000000', amount: 0.5 };
            await (0, walletController_1.deposit)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
        it('should process deposit successfully', async () => {
            mockReq.body = { phoneNumber: '0722000000', amount: 1000 };
            await (0, walletController_1.deposit)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });
});
