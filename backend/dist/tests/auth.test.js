"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authController_1 = require("../controllers/authController");
const client_1 = require("@prisma/client");
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
    let mockReq;
    let mockRes;
    let prisma;
    beforeEach(() => {
        prisma = new client_1.PrismaClient();
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
            mockReq.body = { phoneNumber: '0792325646' };
            await (0, authController_1.register)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
        it('should return 409 if user already exists', async () => {
            mockReq.body = {
                phoneNumber: '0792325646',
                password: 'password',
                fullName: 'Test User',
                idNumber: '12345678',
                dateOfBirth: '2000-01-01',
                confirmAge: true,
            };
            prisma.user.findUnique.mockResolvedValue({ id: '1' });
            await (0, authController_1.register)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(409);
        });
        it('should register user successfully', async () => {
            mockReq.body = {
                phoneNumber: '0792325646',
                password: 'password',
                fullName: 'Test User',
                idNumber: '12345678',
                dateOfBirth: '2000-01-01',
                confirmAge: true,
            };
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue({
                id: '1',
                phoneNumber: '0792325646',
                fullName: 'Test User',
                isAgeVerified: true,
                role: 'USER',
            });
            await (0, authController_1.register)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(prisma.user.create).toHaveBeenCalled();
        });
    });
    describe('login', () => {
        it('should return 400 if phone or password missing', async () => {
            mockReq.body = { phoneNumber: '0792325646' };
            await (0, authController_1.login)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
        it('should return 401 if user not found', async () => {
            mockReq.body = { phoneNumber: '0792325646', password: 'wrongpass' };
            prisma.user.findUnique.mockResolvedValue(null);
            await (0, authController_1.login)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(401);
        });
    });
});
